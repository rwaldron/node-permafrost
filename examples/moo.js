require('../index')('moo.db', function (err, moo) {
    console.dir(moo);
    moo.x = 10;
    moo.x ++;
    moo.xs = [3,4,5];
    moo.xs.push(6);
    moo.xs.push({ a : 1, b : 2, c : [3,4,5] });
    console.dir(moo);
});
