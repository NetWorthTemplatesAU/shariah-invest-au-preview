/* Guess-before-you-scroll tables: click "Reveal the answers" to swap every ?
   cell in that table for its real value. Self-contained, no dependency on
   learn-progress.js or learn-quiz.js. */
(function () {
  document.querySelectorAll('.reveal-table-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var table = btn.nextElementSibling ? btn.nextElementSibling.querySelector('.reveal-table') : null;
      if (!table) return;
      table.querySelectorAll('.reveal-cell').forEach(function (cell) {
        cell.textContent = cell.getAttribute('data-value');
        cell.classList.add('revealed');
      });
      btn.disabled = true;
      btn.textContent = 'Revealed';
    });
  });
})();
