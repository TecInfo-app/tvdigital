const list = [1,2,3,4,5];
const fromIdx = 1; // 2
const toIdx = 3; // 4
const item = list.splice(fromIdx, 1)[0];
list.splice(toIdx, 0, item);
console.log(list);
