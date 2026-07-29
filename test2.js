const list = [
  {id: '1', order: 1},
  {id: '2', order: 2},
  {id: '3', order: 3}
];
const fromIdx = 0;
const toIdx = 2;
const item = list.splice(fromIdx, 1)[0];
list.splice(toIdx, 0, item);
console.log(list);
