import {parseNode} from "./parseNode";

function createDataObjectFromElement (elem) {
  let nodeData = parseNode(elem);

  if (nodeData.key) {
    let innerData = nodeData.value;
    let outerData = {};
    outerData[nodeData.key] = innerData;

    return [innerData, outerData];
  } else {
    return [nodeData.value, nodeData.value];
  }
}

function addDataFromElementToDataObject (elem, parentData) {
  let isParentDataAnObject = !Array.isArray(parentData);
  let nodeData = parseNode(elem);

  if (isParentDataAnObject) {
    if (nodeData.key) {
      parentData[nodeData.key] = nodeData.value;
      return nodeData.value;
    } else {
      Object.assign(parentData, nodeData.value);
      return parentData;
    }
  } else {
    parentData.push(nodeData.value);
    return nodeData.value;
  }
}

export {
  createDataObjectFromElement,
  addDataFromElementToDataObject
};