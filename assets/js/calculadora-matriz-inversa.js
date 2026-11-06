/* Calculadora de matriz inversa (Gauss-Jordan).
   API: matrizInversa(matriz) con matriz = array n x n, 2 <= n <= 5.
   - Inversa por Gauss-Jordan sobre [A | I], con pivote parcial.
   - Si un pivote es 0 (tras buscar el mayor de la columna), la matriz
     es singular y no tiene inversa: devuelve { invertible: false }.
   - Determinante por eliminacion gaussiana (producto de pivotes con
     el signo de los intercambios). Adjunta = transpuesta de cofactores;
     se devuelve tambien para la pagina (A^-1 = adj(A) / det(A)).
   - Los valores se redondean a 4 decimales solo para mostrar; el
     calculo usa precision completa.
   Devuelve { invertible, inversa, determinante, adjunta }.
   Ejemplo verificado: [[4,7],[2,6]] -> det 10,
   inversa [[0,6, -0,7], [-0,2, 0,4]]. */
function matrizInversa(m) {
  var n = m.length;
  function r4(x) { return Math.round(x * 10000) / 10000; }
  var A = m.map(function (fila) { return fila.slice(); });
  var I = [];
  for (var i = 0; i < n; i++) { I.push([]); for (var j = 0; j < n; j++) { I[i].push(i === j ? 1 : 0); } }
  var detSigno = 1, det = 1;
  for (var col = 0; col < n; col++) {
    var piv = col, max = Math.abs(A[col][col]);
    for (var r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > max) { max = Math.abs(A[r][col]); piv = r; }
    }
    if (max < 1e-12) { return { invertible: false, inversa: null, determinante: 0, adjunta: null }; }
    if (piv !== col) {
      var tmp = A[col]; A[col] = A[piv]; A[piv] = tmp;
      var tmp2 = I[col]; I[col] = I[piv]; I[piv] = tmp2;
      detSigno = -detSigno;
    }
    det *= A[col][col];
    var pv = A[col][col];
    for (var k = 0; k < n; k++) { A[col][k] /= pv; I[col][k] /= pv; }
    for (var r2 = 0; r2 < n; r2++) {
      if (r2 !== col) {
        var f = A[r2][col];
        for (var k2 = 0; k2 < n; k2++) { A[r2][k2] -= f * A[col][k2]; I[r2][k2] -= f * I[col][k2]; }
      }
    }
  }
  det = detSigno * det;
  var inv = I.map(function (fila) { return fila.map(r4); });
  var adj = [];
  for (var ii = 0; ii < n; ii++) { adj.push([]); for (var jj = 0; jj < n; jj++) { adj[ii].push(r4(inv[jj][ii] * det)); } }
  return { invertible: true, inversa: inv, determinante: r4(det), adjunta: adj };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function matrizDesdeInputs(n) {
      var M = [];
      for (var i = 0; i < n; i++) { M.push([]); for (var j = 0; j < n; j++) {
        var f = el('esmat-' + i + '-' + j); M[i].push(f ? parseFloat(f.value) || 0 : 0); } }
      return M;
    }
    function render() {
      var n = parseInt((el('esmat-n') || {}).value, 10) || 2;
      n = Math.max(2, Math.min(5, n));
      var r = matrizInversa(matrizDesdeInputs(n));
      var big = el('esmat-big'); if (!big) { return; }
      big.textContent = r.invertible ? 'Matriz invertible · det = ' + r.determinante : 'Matriz singular: no tiene inversa';
      var rows = el('esmat-rows'); if (!rows) { return; }
      rows.innerHTML = r.invertible
        ? '<tr><td>Determinante</td><td>' + r.determinante + '</td></tr>' +
          '<tr><td>Inversa</td><td>' + r.inversa.map(function (fila) { return '[' + fila.join(', ') + ']'; }).join('<br>') + '</td></tr>'
        : '<tr><td>Determinante</td><td>0 (matriz singular)</td></tr>';
    }
    var btn = el('esmat-btn'); if (btn) { btn.addEventListener('click', render); }
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { matrizInversa: matrizInversa }; }
