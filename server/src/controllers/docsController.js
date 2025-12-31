const supabase = require('../config/supabase');

function splitNameForAutoRename(name) {
  if (typeof name !== 'string') return { base: '', ext: '' };
  const lastDot = name.lastIndexOf('.');
  if (lastDot <= 0) return { base: name, ext: '' };
  return { base: name.slice(0, lastDot), ext: name.slice(lastDot) };
}

async function ensureDocsRootDirectory(author_id) {
  const { data: existing } = await supabase.from('nodes').select('id, type').eq('name', 'docs').is('parent_id', null).single();
  if (existing && existing.type === 'DIRECTORY') return existing;

  const insertData = {
    parent_id: null,
    type: 'DIRECTORY',
    name: 'docs',
    content: null,
    visibility_type: 'public',
    author_id,
  };

  const { data, error } = await supabase.from('nodes').insert([insertData]).select('id, type').single();
  if (!error && data) return data;

  const { data: reFetched, error: refetchErr } = await supabase
    .from('nodes')
    .select('id, type')
    .eq('name', 'docs')
    .is('parent_id', null)
    .single();
  if (refetchErr) throw error || refetchErr;
  if (reFetched.type !== 'DIRECTORY') throw new Error('Invalid /docs root node type');
  return reFetched;
}

async function getUniqueNameInParent({ parentId, desiredName, excludeId }) {
  const { base, ext } = splitNameForAutoRename(desiredName);
  let candidate = desiredName;

  for (let i = 0; i < 100; i++) {
    const { data, error } = await supabase
      .from('nodes')
      .select('id')
      .eq('parent_id', parentId)
      .eq('name', candidate)
      .limit(1);

    if (error) throw error;
    const hit = Array.isArray(data) ? data[0] : null;

    if (!hit) return candidate;
    if (excludeId && hit.id === excludeId) return candidate;

    candidate = `${base} (${i + 1})${ext}`;
  }

  throw new Error('Failed to generate unique name');
}

exports.getAllDocs = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json([]);
    }

    const { data, error } = await supabase
      .from('nodes')
      .select('id, parent_id, name, type, visibility_type, author_id')
      .eq('author_id', userId)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.searchDocs = async (req, res) => {
  try {
    console.log('Search query:', req.query);
    const { q, include_following, search_by_subscriber } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    const keyword = q.trim();
    let query;

    if (search_by_subscriber === 'true') {
      let userQuery = supabase
        .from('users')
        .select('id, username, document_title')
        .or(`username.ilike.%${keyword}%,document_title.ilike.%${keyword}%`);

      const { data: matchedUsers, error: userError } = await userQuery;
      if (userError) throw userError;

      if (!matchedUsers || matchedUsers.length === 0) {
        return res.json([]);
      }

      const userIds = matchedUsers.map((u) => u.id);

      const { data: subs } = await supabase.from('subscriptions').select('following_id').eq('follower_id', userId);
      const followingIds = subs?.map((s) => s.following_id) || [];

      let filterStr = `author_id.in.(${userIds.join(',')})`;
      filterStr += `,or(author_id.eq.${userId},and(visibility_type.in.(public,subscriber_only),author_id.in.(${followingIds.join(
        ',',
      )})))`;

      query = supabase
        .from('nodes')
        .select('id, name, type, visibility_type, author_id, users:author_id (username)')
        .or(filterStr)
        .order('type', { ascending: true })
        .limit(50);
    } else if (include_following === 'true') {
      const { data: subs } = await supabase.from('subscriptions').select('following_id').eq('follower_id', userId);
      const followingIds = subs?.map((s) => s.following_id) || [];

      let filterStr = `author_id.eq.${userId}`;
      if (followingIds.length > 0) {
        filterStr += `,and(author_id.in.(${followingIds.join(',')}),visibility_type.in.(public,subscriber_only))`;
      }

      query = supabase
        .from('nodes')
        .select('id, name, type, visibility_type, author_id, users:author_id (username)')
        .or(filterStr)
        .ilike('name', `%${keyword}%`)
        .order('type', { ascending: true })
        .limit(50);
    } else {
      query = supabase
        .from('nodes')
        .select('id, name, type, visibility_type, author_id, users:author_id (username)')
        .eq('author_id', userId)
        .ilike('name', `%${keyword}%`)
        .order('type', { ascending: true })
        .limit(50);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('searchDocs error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserDocs = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user?.id;

    let allowedVisibilities = ['public'];

    if (viewerId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('follower_id', viewerId)
        .eq('following_id', userId)
        .single();

      if (subscription) {
        allowedVisibilities.push('subscriber_only');
      }

      if (viewerId === userId) {
        allowedVisibilities.push('subscriber_only', 'private');
      }
    }

    const { data, error } = await supabase
      .from('nodes')
      .select('id, parent_id, name, type, visibility_type, author_id')
      .eq('author_id', userId)
      .in('visibility_type', allowedVisibilities)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDocById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: doc, error } = await supabase
      .from('nodes')
      .select('id, parent_id, name, type, content, visibility_type, author_id, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Document not found' });
      throw error;
    }

    if (doc.visibility_type === 'private' && (!req.user || req.user.id !== doc.author_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (doc.visibility_type === 'subscriber_only' && (!req.user || req.user.id !== doc.author_id)) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('follower_id', req.user?.id)
        .eq('following_id', doc.author_id)
        .single();

      if (!sub) {
        return res.status(403).json({ error: 'Access denied. Subscriber only.' });
      }
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDocByPath = async (req, res) => {
  res.status(410).json({ error: 'Path based access is no longer supported. Use ID based access.' });
};

exports.createDoc = async (req, res) => {
  try {
    const { type, parent_id: req_parent_id, name, content, visibility_type } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;
    const parent_id = req_parent_id || null;

    const insertData = {
      parent_id,
      type,
      name,
      content: type === 'FILE' ? content : null,
      visibility_type: visibility_type || 'public',
      author_id: author_id,
    };

    const { data, error } = await supabase
      .from('nodes')
      .insert([insertData])
      .select('id, parent_id, name, type, visibility_type, author_id')
      .single();

    if (error) {
      console.error('createDoc: Supabase insert error:', error);
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    const { parent_id, is_public } = req.body;
    const content = req.file.buffer.toString('utf8');
    const originalName = req.file.originalname;
    const name = originalName.replace(/\.md$/i, '');

    const { data, error } = await supabase
      .from('nodes')
      .insert([
        {
          parent_id: parent_id || null,
          type: 'FILE',
          name,
          content,
          visibility_type: is_public !== undefined ? (is_public === 'true' ? 'public' : 'private') : 'public',
          author_id,
        },
      ])
      .select('id, parent_id, name, type, visibility_type, author_id')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, visibility_type, name } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    const { data: existingNode } = await supabase.from('nodes').select('author_id').eq('id', id).single();

    if (!existingNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    if (existingNode.author_id !== author_id) {
      return res.status(403).json({ error: 'Permission denied. You can only update your own nodes.' });
    }

    const updates = { updated_at: new Date() };
    if (content !== undefined) updates.content = content;
    if (visibility_type !== undefined) updates.visibility_type = visibility_type;
    if (name !== undefined) updates.name = name;

    const { data, error } = await supabase
      .from('nodes')
      .update(updates)
      .eq('id', id)
      .select('id, parent_id, name, type, visibility_type, author_id')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    const { data: node } = await supabase.from('nodes').select('author_id, type').eq('id', id).single();

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    if (node.author_id !== author_id) {
      return res.status(403).json({ error: 'Permission denied. You can only delete your own nodes.' });
    }

    const deleteRecursive = async (nodeId) => {
      const { data: children } = await supabase.from('nodes').select('id').eq('parent_id', nodeId);

      if (children && children.length > 0) {
        for (const child of children) {
          await deleteRecursive(child.id);
        }
      }

      const { error } = await supabase.from('nodes').delete().eq('id', nodeId);
      if (error) throw error;
    };

    await deleteRecursive(id);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.moveDoc = async (req, res) => {
  try {
    const { id, target_parent_id } = req.body || {};

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    if (!id) {
      return res.status(400).json({ error: 'Missing required field: id' });
    }

    const { data: source, error: sourceErr } = await supabase
      .from('nodes')
      .select('id, parent_id, name, type, author_id')
      .eq('id', id)
      .single();

    if (sourceErr) {
      if (sourceErr.code === 'PGRST116') return res.status(404).json({ error: 'Node not found' });
      throw sourceErr;
    }

    if (source.author_id !== author_id) {
      return res.status(403).json({ error: 'Permission denied. You can only move your own nodes.' });
    }

    let targetParentId = target_parent_id === null || target_parent_id === 'null' ? null : target_parent_id;

    if (targetParentId) {
      const { data: targetParent, error: targetErr } = await supabase
        .from('nodes')
        .select('id, type')
        .eq('id', targetParentId)
        .single();

      if (targetErr) {
        if (targetErr.code === 'PGRST116') {
          return res.status(404).json({ error: 'Target parent directory not found' });
        }
        throw targetErr;
      }

      if (!targetParent || targetParent.type !== 'DIRECTORY') {
        return res.status(400).json({ error: 'Drop target must be a directory.' });
      }

      if (source.type === 'DIRECTORY' && source.id === targetParentId) {
        return res.status(400).json({ error: 'Cannot move a directory into itself.' });
      }
    }

    if (source.parent_id === targetParentId) {
      return res.json({
        id: source.id,
        parent_id: source.parent_id,
        noop: true,
      });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('nodes')
      .update({
        parent_id: targetParentId,
      })
      .eq('id', source.id)
      .select('id, parent_id, name, type, author_id')
      .single();

    if (updateErr) throw updateErr;

    res.json({
      id: updated.id,
      parent_id: updated.parent_id,
    });
  } catch (err) {
    console.error('moveDoc error:', {
      message: err?.message,
      stack: err?.stack,
      body: req?.body,
      userId: req?.user?.id,
    });
    res.status(500).json({ error: err.message });
  }
};
