import { buildDirectoryTree } from './treeUtils';

/**
 * author_id별로 노드를 그룹화하고 username을 매핑하는 함수
 * @param {Array} nodes - 노드 배열
 * @param {Object} userMap - userId -> username 매핑 객체
 * @returns {Object} author_id별로 그룹화된 트리 구조
 */
export function buildUserGroupedTree(nodes, userMap = {}) {
  // author_id별로 그룹화
  const groupedByAuthor = {};
  
  nodes.forEach((node) => {
    const authorId = node.author_id || 'undefined';
    if (!groupedByAuthor[authorId]) {
      groupedByAuthor[authorId] = [];
    }
    groupedByAuthor[authorId].push(node);
  });

  // 각 author_id별로 트리 구성
  const result = {};
  
  Object.keys(groupedByAuthor).forEach((authorId) => {
    const userNodes = groupedByAuthor[authorId];
    const username = userMap[authorId] || authorId === 'undefined' ? 'undefined' : authorId;
    const tree = buildDirectoryTree(userNodes);
    
    result[username] = tree;
  });

  return result;
}

/**
 * 사용자 정보를 가져와서 userId -> username 매핑 생성
 * @param {Array} userIds - 사용자 ID 배열
 * @returns {Promise<Object>} userId -> username 매핑 객체
 */
export async function buildUserMap(userIds) {
  // TODO: API에서 사용자 정보를 가져와서 매핑 생성
  // 현재는 빈 객체 반환 (나중에 구현)
  return {};
}

