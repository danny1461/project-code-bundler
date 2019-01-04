module.exports = function(arr, caseInsensitive) {
	for (var z = 0, t; t = arr[z]; z++) {
        arr[z] = new Array();
        var x = 0, y = -1, n = 0, i, j;

        while (i = (j = t.charAt(x++)).charCodeAt(0)) {
            var m = (i == 46 || (i >=48 && i <= 57));
            if (m !== n) {
                arr[z][++y] = "";
                n = m;
            }
            arr[z][y] += j;
        }
    }

    arr.sort(function(a, b) {
        for (var x = 0, aa, bb; (aa = a[x]) && (bb = b[x]); x++) {
            if (caseInsensitive) {
                aa = aa.toLowerCase();
                bb = bb.toLowerCase();
            }
            if (aa !== bb) {
                var c = Number(aa), d = Number(bb);
                if (c == aa && d == bb) {
                    return c - d;
                } else return (aa > bb) ? 1 : -1;
            }
        }
        return a.length - b.length;
    });

    for (var z = 0; z < arr.length; z++) {
        arr[z] = arr[z].join("");
	}
}