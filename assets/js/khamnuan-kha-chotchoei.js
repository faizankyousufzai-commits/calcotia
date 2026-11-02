(function () {
  'use strict';

  // Thailand severance pay (Labour Protection Act B.E. 2541, sections 118-119
  // as amended by Act No. 7 B.E. 2562, 400-day top tier).
  // Tier table (service -> days of last wages):
  //   < 120 days: 0 (no entitlement)
  //   120 days to < 1 year: 30
  //   1 to < 3 years: 90
  //   3 to < 6 years: 180
  //   6 to < 10 years: 240
  //   10 to < 20 years: 300
  //   20+ years: 400
  // Daily wage = last monthly wage / 30.
  // Tax (Ministerial Regulation No. 394, Royal Gazette 17 Jul 2024, effective
  // 1 Jan 2023): for involuntary-termination (dismissal) severance only, the
  // exempt portion = min(400 days' wages, 600,000 THB). The old 300-day /
  // 300,000 THB limits are superseded. Retirement and fixed-term-end
  // severance are NOT covered by this exemption.
  // Section 48(5) concession (if elected) on the taxable portion:
  // concession-taxed base = max((taxable - 7,000 x full years) / 2, 0).
  // Section 119 grounds stated in the termination letter -> no severance.
  // Genuine fixed-term expiry (specific project / seasonal work with an
  // agreed end date) -> no severance; otherwise the section 118 scale applies.
  function tierDays(serviceDays, fullYears) {
    if (serviceDays < 120) return 0;
    if (fullYears < 1) return 30;
    if (fullYears < 3) return 90;
    if (fullYears < 6) return 180;
    if (fullYears < 10) return 240;
    if (fullYears < 20) return 300;
    return 400;
  }

  function fullYearsBetween(start, end) {
    var y = end.getFullYear() - start.getFullYear();
    if (end.getMonth() < start.getMonth() ||
      (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) {
      y -= 1;
    }
    return Math.max(0, y);
  }

  function calc(input) {
    var monthly = Math.max(0, input.monthly || 0);
    var dailyInput = Math.max(0, input.daily || 0);
    var daily = dailyInput > 0 ? dailyInput : monthly / 30;
    var serviceDays = 0;
    var fullYears = 0;
    var start = input.start ? new Date(input.start + 'T00:00:00') : null;
    var end = input.end ? new Date(input.end + 'T00:00:00') : null;
    if (start && end && !isNaN(start) && !isNaN(end) && end >= start) {
      serviceDays = Math.round((end - start) / 86400000);
      fullYears = fullYearsBetween(start, end);
    } else {
      var y = Math.max(0, parseInt(input.years, 10) || 0);
      var d = Math.max(0, parseInt(input.days, 10) || 0);
      serviceDays = y * 365 + d;
      fullYears = y;
    }
    var caseType = input.caseType || 'dismissal';
    var section119 = !!input.section119;
    var genuineFixed = !!input.genuineFixed;

    var days = tierDays(serviceDays, fullYears);
    var severance = daily * days;
    var noPayReason = '';
    if (section119) {
      noPayReason = 'section119';
      severance = 0;
    } else if (caseType === 'fixed' && genuineFixed) {
      noPayReason = 'fixed';
      severance = 0;
    }

    var exempt = 0;
    var taxable = 0;
    var concessionBase = 0;
    if (severance > 0 && caseType === 'dismissal') {
      exempt = Math.min(400 * daily, 600000);
      if (exempt > severance) exempt = severance;
      taxable = severance - exempt;
      if (taxable > 0) {
        concessionBase = Math.max((taxable - 7000 * fullYears) / 2, 0);
      }
    } else if (severance > 0) {
      // Retirement and fixed-term-end severance: no M.R. 394 exemption.
      taxable = severance;
    }

    return {
      monthly: monthly,
      daily: daily,
      serviceDays: serviceDays,
      fullYears: fullYears,
      caseType: caseType,
      tierDays: days,
      severance: severance,
      exempt: exempt,
      taxable: taxable,
      concessionBase: concessionBase,
      noPayReason: noPayReason
    };
  }

  function round0(x) { return Math.round(x); }

  if (typeof document !== 'undefined') {
    var fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

    function val(id) {
      var el = document.getElementById(id);
      if (!el) return 0;
      var v = parseFloat(String(el.value).replace(',', '.'));
      return isNaN(v) || v < 0 ? 0 : v;
    }
    function intVal(id) {
      var el = document.getElementById(id);
      if (!el) return 0;
      var v = parseInt(el.value, 10);
      return isNaN(v) || v < 0 ? 0 : v;
    }
    function set(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = fmt.format(v) + ' บาท';
    }
    function setText(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = v;
    }
    function radioVal(name, fallback) {
      var els = document.querySelectorAll('input[name="' + name + '"]:checked');
      return els.length ? els[0].value : fallback;
    }

    function run() {
      var wageMode = radioVal('th-wage-mode', 'monthly');
      var caseType = radioVal('th-case', 'dismissal');
      var r = calc({
        monthly: wageMode === 'monthly' ? val('th-monthly') : 0,
        daily: wageMode === 'daily' ? val('th-daily') : 0,
        start: (document.getElementById('th-start') || {}).value || '',
        end: (document.getElementById('th-end') || {}).value || '',
        years: intVal('th-years'),
        days: intVal('th-days'),
        caseType: caseType,
        section119: !!(document.getElementById('th-s119') || {}).checked,
        genuineFixed: !!(document.getElementById('th-fixed-genuine') || {}).checked
      });
      set('th-big', r.severance);
      set('th-daily-out', r.daily);
      setText('th-service', r.fullYears + ' ปี ' + Math.max(0, r.serviceDays - r.fullYears * 365) + ' วัน (' + fmt.format(r.serviceDays) + ' วัน)');
      setText('th-tier', r.tierDays + ' วัน');
      set('th-severance', r.severance);
      set('th-exempt', r.exempt);
      set('th-taxable', r.taxable);
      set('th-concession', r.concessionBase);

      var note = document.getElementById('th-note');
      if (note) {
        if (r.noPayReason === 'section119') {
          note.textContent = 'ตามมาตรา 119 หากนายจ้างเลิกจ้างด้วยเหตุที่กฎหมายกำหนดและระบุเหตุไว้ในหนังสือเลิกจ้าง ลูกจ้างไม่มีสิทธิได้รับค่าชดเชย ผลลัพธ์จึงเป็น 0 บาท';
        } else if (r.noPayReason === 'fixed') {
          note.textContent = 'สัญญาจ้างที่มีกำหนดระยะเวลาที่แท้จริง (งานเฉพาะโครงการหรืองานตามฤดูกาลที่มีวันสิ้นสุดที่ตกลงกันไว้) เมื่อครบกำหนดแล้วไม่ต้องจ่ายค่าชดเชย';
        } else if (r.tierDays === 0) {
          note.textContent = 'อายุงานน้อยกว่า 120 วัน ยังไม่มีสิทธิได้รับค่าชดเชยตามมาตรา 118 โปรดตรวจสอบวันเริ่มงานจริง';
        } else if (caseType === 'retirement') {
          note.textContent = 'การเกษียณอายุถือเป็นการเลิกจ้างตามมาตรา 118/1 และใช้อัตราเดียวกับมาตรา 118 แต่การยกเว้นภาษีตามกฎกระทรวงฉบับที่ 394 ใช้เฉพาะค่าชดเชยจากการเลิกจ้างโดยไม่สมัครใจ จึงไม่ใช้กับกรณีเกษียณอายุ';
        } else {
          note.textContent = 'ค่าบอกกล่าวล่วงหน้า ค่าจ้างที่ค้างจ่าย และค่าจ้างสำหรับวันหยุดพักผ่อนประจำปีที่ไม่ได้ใช้ เป็นสิทธิแยกต่างหากและไม่รวมอยู่ในยอดค่าชดเชยนี้';
        }
      }
      var taxNote = document.getElementById('th-taxnote');
      if (taxNote) {
        if (r.severance > 0 && caseType === 'dismissal' && r.taxable > 0) {
          taxNote.textContent = 'ส่วนที่เกินกว่าที่ได้รับยกเว้นต้องเสียภาษี โดยอาจใช้สิทธิมาตรา 48(5) ได้ คือหัก 7,000 บาทต่อปีอายุงานก่อน แล้วนำครึ่งหนึ่งของส่วนที่เหลือมาคำนวณภาษี ฐานภาษีหลังใช้สิทธิดังกล่าวคือ ' + fmt.format(r.concessionBase) + ' บาท';
        } else if (r.severance > 0 && caseType === 'dismissal') {
          taxNote.textContent = 'ยอดทั้งหมดได้รับยกเว้นภาษีตามกฎกระทรวงฉบับที่ 394 (ต่ำกว่าระหว่างค่าจ้าง 400 วันกับ 600,000 บาท)';
        } else {
          taxNote.textContent = '';
        }
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('th-form');
      if (form) {
        form.addEventListener('input', run);
        form.addEventListener('change', run);
      }
      var btn = document.getElementById('th-btn');
      if (btn) btn.addEventListener('click', run);
      run();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calc: calc, tierDays: tierDays, round0: round0 };
  }
})();
