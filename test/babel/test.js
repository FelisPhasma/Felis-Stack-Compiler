function alpha(thisFunc, has, a, lot, ofvars){
    return arguments[0] + this + has;
}

[1,2,3].map(n => n + 1);

class SkinnedMesh {}

const obj = {
    test() {
        
    }
}

const t = `In ES5 this is
 not legal.`;

var [a, ,b] = [1,2,3];

function f(x, ...y) {
  // y is an Array
  return x * y.length;
}
f(3, "hello", true) == 6

let fibonacci = {
  [Symbol.iterator]() {
    let pre = 0, cur = 1;
    return {
      next() {
        [pre, cur] = [cur, pre + cur];
        return { done: false, value: cur }
      }
    }
  }
}

for (var n of fibonacci) {
  // truncate the sequence at 1000
  if (n > 1000)
    break;
  console.log(n);
}

