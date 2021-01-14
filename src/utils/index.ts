
export const nodeListToArray = <T extends Node>(nodeList: NodeListOf<T>): Array<T>  => {
  let array: Array<T> = []
  nodeList.forEach(item => array.push(item))
  return array
}