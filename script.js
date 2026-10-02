/* =========================================================
   LydAutomation Portfolio — script.js
   All logic below runs entirely in the browser.
   NORA and Cybervast demos use fictional sample data only —
   no real emails, databases, webhooks, or AI calls are made.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------
     MOBILE NAVIGATION
     --------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  var menuToggle = document.getElementById('menuToggle');
  var mobileNav = document.getElementById('mobileNav');

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      var isOpen = header.classList.toggle('nav-open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------
     SHARED HELPERS
     --------------------------------------------------------- */
  function formatFutureDate(daysFromNow) {
    var d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    var options = { weekday: 'long', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  // Three fictional future dates used for booking / rescheduling
  function getSampleFutureDates() {
    return [formatFutureDate(6), formatFutureDate(9), formatFutureDate(13)];
  }

  var SAMPLE_TIMES = ['9:00 AM', '11:30 AM', '2:00 PM'];

  // A single, consistent "existing appointment" date used whenever the
  // demo needs to show a pre-existing fictional appointment (retrieve,
  // reschedule, cancel) so it always reads as a genuine future date.
  function getExistingAppointmentDate() {
    return formatFutureDate(7);
  }

  function el(tag, className, html) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  /* =========================================================
     NORA — AI PATIENT APPOINTMENT ASSISTANT DEMO
     ========================================================= */
  (function initNora() {
    var container = document.getElementById('noraDemoBody');
    if (!container) return;

    var DEPARTMENTS = ['Dermatology', 'Ophthalmology', 'Physiotherapy', 'ENT'];

    var state = {
      screen: 'menu',
      action: null,
      department: null,
      selectedDate: null,
      selectedTime: null,
      patientName: null,
      patientEmail: null,
      patientPhone: null,
      appointmentId: 'NORA-DEMO-1024',
      appointmentStatus: 'Confirmed',
      // used for reschedule flow
      existingDepartment: 'Dermatology',
      existingDate: getExistingAppointmentDate(),
      existingTime: '11:30 AM',
      newDate: null,
      newTime: null
    };

    function resetAll() {
      state.screen = 'menu';
      state.action = null;
      state.department = null;
      state.selectedDate = null;
      state.selectedTime = null;
      state.patientName = null;
      state.patientEmail = null;
      state.patientPhone = null;
      state.appointmentId = 'NORA-DEMO-1024';
      state.appointmentStatus = 'Confirmed';
      state.existingDepartment = 'Dermatology';
      state.existingDate = getExistingAppointmentDate();
      state.existingTime = '11:30 AM';
      state.newDate = null;
      state.newTime = null;
      render();
    }

    function backToMenu() {
      state.screen = 'menu';
      state.action = null;
      state.selectedDate = null;
      state.selectedTime = null;
      state.newDate = null;
      state.newTime = null;
      render();
    }

    function resultCard(title, fields, statusClass) {
      var card = el('div', 'demo-card');
      card.appendChild(el('p', 'demo-card-title', title));
      fields.forEach(function (f) {
        var row = el('div', 'demo-record-row');
        row.appendChild(el('span', null, f[0]));
        var valueSpan = el('span', f[2] ? f[2] : null, f[1]);
        row.appendChild(valueSpan);
        card.appendChild(row);
      });
      return card;
    }

    function nextStepsBlock(title, items) {
      var box = el('div', 'demo-next-steps');
      box.appendChild(el('h4', null, title));
      var ul = el('ul');
      items.forEach(function (i) { ul.appendChild(el('li', null, i)); });
      box.appendChild(ul);
      return box;
    }

    function optionButtons(options, onSelect) {
      var wrap = el('div', 'demo-options');
      options.forEach(function (opt) {
        var btn = el('button', 'demo-option-btn', opt);
        btn.type = 'button';
        btn.addEventListener('click', function () { onSelect(opt); });
        wrap.appendChild(btn);
      });
      return wrap;
    }

    function chipSummary(pairs) {
      var wrap = el('div', 'demo-selected-summary');
      pairs.forEach(function (p) {
        if (p[1]) wrap.appendChild(el('span', 'demo-chip', p[0] + ': ' + p[1]));
      });
      return wrap;
    }

    function tryAnotherActionBtn() {
      var btn = el('button', 'btn btn-secondary', 'Try Another Action');
      btn.type = 'button';
      btn.addEventListener('click', backToMenu);
      return btn;
    }

    function render() {
      container.innerHTML = '';

      if (state.screen === 'menu') {
        container.appendChild(el('p', 'demo-message', "Hello, I'm NORA, your virtual appointment assistant. What would you like to do?"));
        container.appendChild(optionButtons(
          ['Book Appointment', 'Reschedule Appointment', 'Cancel Appointment', 'Retrieve Appointment'],
          function (opt) {
            if (opt === 'Book Appointment') { state.screen = 'book-department'; }
            if (opt === 'Reschedule Appointment') { state.screen = 'reschedule-ask-id'; }
            if (opt === 'Cancel Appointment') { state.screen = 'cancel-ask-id'; }
            if (opt === 'Retrieve Appointment') { state.screen = 'retrieve-ask-id'; }
            render();
          }
        ));
        var restart = el('button', 'btn btn-secondary', 'Restart Demo');
        restart.type = 'button';
        restart.style.marginTop = '8px';
        restart.addEventListener('click', resetAll);
        container.appendChild(restart);
        return;
      }

      /* ---------- BOOK APPOINTMENT ---------- */
      if (state.screen === 'book-department') {
        container.appendChild(el('p', 'demo-message', 'Which department would you like to book with?'));
        container.appendChild(optionButtons(DEPARTMENTS, function (dept) {
          state.department = dept;
          state.screen = 'book-date';
          render();
        }));
        return;
      }

      if (state.screen === 'book-date') {
        container.appendChild(chipSummary([['Department', state.department]]));
        container.appendChild(el('p', 'demo-message', 'Here are the next available dates:'));
        container.appendChild(optionButtons(getSampleFutureDates(), function (date) {
          state.selectedDate = date;
          state.screen = 'book-time';
          render();
        }));
        return;
      }

      if (state.screen === 'book-time') {
        container.appendChild(chipSummary([['Department', state.department], ['Date', state.selectedDate]]));
        container.appendChild(el('p', 'demo-message', 'What time works best?'));
        container.appendChild(optionButtons(SAMPLE_TIMES, function (time) {
          state.selectedTime = time;
          state.screen = 'book-details';
          render();
        }));
        return;
      }

      if (state.screen === 'book-details') {
        container.appendChild(chipSummary([['Department', state.department], ['Date', state.selectedDate], ['Time', state.selectedTime]]));
        container.appendChild(el('p', 'demo-message', 'Perfect. I just need a few details to complete your appointment.'));
        var btn = el('button', 'btn btn-primary', 'Use Sample Details \u2192');
        btn.type = 'button';
        btn.addEventListener('click', function () {
          state.patientName = 'Demo Patient';
          state.patientEmail = 'patient@example.com';
          state.patientPhone = '0800 000 0000';
          state.screen = 'book-review';
          render();
        });
        container.appendChild(btn);
        return;
      }

      if (state.screen === 'book-review') {
        container.appendChild(resultCard('Appointment Review', [
          ['Patient', state.patientName],
          ['Department', state.department],
          ['Date', state.selectedDate],
          ['Time', state.selectedTime],
          ['Email', state.patientEmail],
          ['Phone', state.patientPhone]
        ]));
        var confirmBtn = el('button', 'btn btn-primary', 'Confirm Appointment');
        confirmBtn.type = 'button';
        confirmBtn.addEventListener('click', function () {
          state.appointmentStatus = 'Confirmed';
          state.screen = 'book-result';
          render();
        });
        container.appendChild(confirmBtn);
        return;
      }

      if (state.screen === 'book-result') {
        container.appendChild(el('p', 'demo-result-heading', '\u2713 Appointment Booked Successfully'));
        container.appendChild(resultCard('Appointment Record', [
          ['Appointment ID', state.appointmentId],
          ['Patient', state.patientName],
          ['Department', state.department],
          ['Date', state.selectedDate],
          ['Time', state.selectedTime],
          ['Status', state.appointmentStatus, 'demo-status-confirmed']
        ]));
        container.appendChild(nextStepsBlock('What The Real System Does Next', [
          'Records the appointment',
          'Sends the patient a confirmation email',
          'Notifies the relevant department',
          'Sends the patient an appointment reminder'
        ]));
        container.appendChild(tryAnotherActionBtn());
        return;
      }

           /* ---------- RESCHEDULE ---------- */
      if (state.screen === 'reschedule-ask-id') {
        container.appendChild(el('p', 'demo-message', 'Do you have your appointment ID?'));

        container.appendChild(optionButtons(['Yes', 'No'], function (answer) {
          if (answer === 'Yes') {
            state.screen = 'reschedule-current';
          } else {
            state.screen = 'reschedule-noid-details';
          }

          render();
        }));

        return;
      }

      if (state.screen === 'reschedule-noid-details') {
        container.appendChild(
          el(
            'p',
            'demo-message',
            'No problem. I can help retrieve your appointment using other information.'
          )
        );

        var useSampleBtnReschedule = el(
          'button',
          'btn btn-primary',
          'Use Sample Patient Details →'
        );

        useSampleBtnReschedule.type = 'button';

        useSampleBtnReschedule.addEventListener('click', function () {
          state.patientName = 'Demo Patient';
          state.patientEmail = 'patient@example.com';
          state.patientPhone = '0800 000 0000';

          state.screen = 'reschedule-noid-review';
          render();
        });

        container.appendChild(useSampleBtnReschedule);
        return;
      }

      if (state.screen === 'reschedule-noid-review') {
        container.appendChild(
          el(
            'p',
            'demo-message',
            'Here are the sample patient details I’ll use to search:'
          )
        );

        container.appendChild(
          resultCard('Patient Details', [
            ['Name', state.patientName],
            ['Email', state.patientEmail],
            ['Phone', state.patientPhone]
          ])
        );

        var findBtnReschedule = el(
          'button',
          'btn btn-primary',
          'Find Appointment →'
        );

        findBtnReschedule.type = 'button';

        findBtnReschedule.addEventListener('click', function () {
          state.screen = 'reschedule-noid-processing';
          render();

          setTimeout(function () {
            if (state.screen === 'reschedule-noid-processing') {
              state.screen = 'reschedule-noid-found';
              render();
            }
          }, 900);
        });

        container.appendChild(findBtnReschedule);
        return;
      }

      if (state.screen === 'reschedule-noid-processing') {
        container.appendChild(
          el('p', 'demo-processing', 'Finding your appointment…')
        );

        return;
      }

      if (state.screen === 'reschedule-noid-found') {
        container.appendChild(
          el('p', 'demo-result-heading', '✓ Appointment Found')
        );

        container.appendChild(
          resultCard('Appointment', [
            ['Appointment ID', state.appointmentId],
            ['Patient', 'Demo Patient'],
            ['Department', state.existingDepartment],
            ['Date', state.existingDate],
            ['Time', state.existingTime],
            ['Status', 'Confirmed', 'demo-status-confirmed']
          ])
        );

        container.appendChild(
          el('p', 'demo-message', 'Choose a new date:')
        );

        container.appendChild(
          optionButtons(getSampleFutureDates(), function (date) {
            state.newDate = date;
            state.screen = 'reschedule-time';
            render();
          })
        );

        return;
      }

      if (state.screen === 'reschedule-current') {
        container.appendChild(el('p', 'demo-message', 'Here is your current appointment:'));
        container.appendChild(resultCard('Current Appointment', [
          ['Appointment ID', state.appointmentId],
          ['Patient', 'Demo Patient'],
          ['Department', state.existingDepartment],
          ['Date', state.existingDate],
          ['Time', state.existingTime],
          ['Status', 'Confirmed', 'demo-status-confirmed']
        ]));
        container.appendChild(el('p', 'demo-message', 'Choose a new date:'));
        container.appendChild(optionButtons(getSampleFutureDates(), function (date) {
          state.newDate = date;
          state.screen = 'reschedule-time';
          render();
        }));
        return;
      }

      if (state.screen === 'reschedule-time') {
        container.appendChild(chipSummary([['New Date', state.newDate]]));
        container.appendChild(el('p', 'demo-message', 'Choose a new time:'));
        container.appendChild(optionButtons(SAMPLE_TIMES, function (time) {
          state.newTime = time;
          state.screen = 'reschedule-compare';
          render();
        }));
        return;
      }

      if (state.screen === 'reschedule-compare') {
        var compareWrap = el('div', 'demo-comparison');
        var currentBlock = el('div', 'demo-comparison-block');
        currentBlock.appendChild(el('h4', null, 'CURRENT'));
        currentBlock.appendChild(el('p', null, state.existingDate + ' &middot; ' + state.existingTime));
        var arrow = el('div', 'demo-comparison-arrow', '\u2192');
        var newBlock = el('div', 'demo-comparison-block');
        newBlock.appendChild(el('h4', null, 'NEW'));
        newBlock.appendChild(el('p', null, state.newDate + ' &middot; ' + state.newTime));
        compareWrap.appendChild(currentBlock);
        compareWrap.appendChild(arrow);
        compareWrap.appendChild(newBlock);
        container.appendChild(compareWrap);

        var confirmBtn = el('button', 'btn btn-primary', 'Confirm Reschedule');
        confirmBtn.type = 'button';
        confirmBtn.addEventListener('click', function () {
          state.existingDate = state.newDate;
          state.existingTime = state.newTime;
          state.screen = 'reschedule-result';
          render();
        });
        container.appendChild(confirmBtn);
        return;
      }

      if (state.screen === 'reschedule-result') {
        container.appendChild(el('p', 'demo-result-heading', '\u2713 Appointment Rescheduled Successfully'));
        container.appendChild(resultCard('Updated Appointment', [
          ['Appointment ID', state.appointmentId],
          ['Patient', 'Demo Patient'],
          ['Department', state.existingDepartment],
          ['Date', state.existingDate],
          ['Time', state.existingTime],
          ['Status', 'Confirmed', 'demo-status-confirmed']
        ]));
        container.appendChild(nextStepsBlock('What The Real System Does Next', [
          'Updates the existing appointment',
          'Records the newly selected slot',
          'Sends the patient updated appointment information',
          'Keeps appointment records synchronized'
        ]));
        container.appendChild(tryAnotherActionBtn());
        return;
      }

            /* ---------- CANCEL ---------- */
      if (state.screen === 'cancel-ask-id') {
        container.appendChild(el('p', 'demo-message', 'Do you have your appointment ID?'));

        container.appendChild(optionButtons(['Yes', 'No'], function (answer) {
          if (answer === 'Yes') {
            state.appointmentStatus = 'Confirmed';
            state.screen = 'cancel-show';
          } else {
            state.screen = 'cancel-noid-details';
          }

          render();
        }));

        return;
      }

      if (state.screen === 'cancel-noid-details') {
        container.appendChild(
          el(
            'p',
            'demo-message',
            'No problem. I can help retrieve your appointment using other information.'
          )
        );

        var useSampleBtnCancel = el(
          'button',
          'btn btn-primary',
          'Use Sample Patient Details →'
        );

        useSampleBtnCancel.type = 'button';

        useSampleBtnCancel.addEventListener('click', function () {
          state.patientName = 'Demo Patient';
          state.patientEmail = 'patient@example.com';
          state.patientPhone = '0800 000 0000';

          state.screen = 'cancel-noid-review';
          render();
        });

        container.appendChild(useSampleBtnCancel);
        return;
      }

      if (state.screen === 'cancel-noid-review') {
        container.appendChild(
          el(
            'p',
            'demo-message',
            'Here are the sample patient details I’ll use to search:'
          )
        );

        container.appendChild(
          resultCard('Patient Details', [
            ['Name', state.patientName],
            ['Email', state.patientEmail],
            ['Phone', state.patientPhone]
          ])
        );

        var findBtnCancel = el(
          'button',
          'btn btn-primary',
          'Find Appointment →'
        );

        findBtnCancel.type = 'button';

        findBtnCancel.addEventListener('click', function () {
          state.screen = 'cancel-noid-processing';
          render();

          setTimeout(function () {
            if (state.screen === 'cancel-noid-processing') {
              state.screen = 'cancel-noid-found';
              render();
            }
          }, 900);
        });

        container.appendChild(findBtnCancel);
        return;
      }

      if (state.screen === 'cancel-noid-processing') {
        container.appendChild(
          el('p', 'demo-processing', 'Finding your appointment…')
        );

        return;
      }

      if (state.screen === 'cancel-noid-found') {
        container.appendChild(
          el('p', 'demo-result-heading', '✓ Appointment Found')
        );

        container.appendChild(
          resultCard('Appointment', [
            ['Appointment ID', state.appointmentId],
            ['Patient', 'Demo Patient'],
            ['Department', state.existingDepartment],
            ['Date', state.existingDate],
            ['Time', state.existingTime],
            ['Status', 'Confirmed', 'demo-status-confirmed']
          ])
        );

        state.appointmentStatus = 'Confirmed';

        var cancelBtnFromFound = el(
          'button',
          'btn btn-primary',
          'Cancel This Appointment'
        );

        cancelBtnFromFound.type = 'button';

        cancelBtnFromFound.addEventListener('click', function () {
          state.screen = 'cancel-confirm';
          render();
        });

        container.appendChild(cancelBtnFromFound);
        return;
      }

      if (state.screen === 'cancel-show') {
        container.appendChild(resultCard('Appointment To Cancel', [
          ['Appointment ID', state.appointmentId],
          ['Patient', 'Demo Patient'],
          ['Department', state.existingDepartment],
          ['Date', state.existingDate],
          ['Time', state.existingTime],
          ['Status', state.appointmentStatus, 'demo-status-confirmed']
        ]));
        var cancelBtn = el('button', 'btn btn-primary', 'Cancel This Appointment');
        cancelBtn.type = 'button';
        cancelBtn.addEventListener('click', function () {
          state.screen = 'cancel-confirm';
          render();
        });
        container.appendChild(cancelBtn);
        return;
      }

      if (state.screen === 'cancel-confirm') {
        container.appendChild(el('p', 'demo-message', 'Are you sure you want to cancel this appointment?'));
        var actions = el('div', 'demo-actions');
        var keepBtn = el('button', 'btn btn-secondary', 'Keep Appointment');
        keepBtn.type = 'button';
        keepBtn.addEventListener('click', function () {
          state.appointmentStatus = 'Confirmed';
          state.screen = 'cancel-kept';
          render();
        });
        var cancelYesBtn = el('button', 'btn btn-primary', 'Yes, Cancel Appointment');
        cancelYesBtn.type = 'button';
        cancelYesBtn.addEventListener('click', function () {
          state.appointmentStatus = 'Cancelled';
          state.screen = 'cancel-result';
          render();
        });
        actions.appendChild(keepBtn);
        actions.appendChild(cancelYesBtn);
        container.appendChild(actions);
        return;
      }

      if (state.screen === 'cancel-kept') {
        container.appendChild(el('p', 'demo-result-heading', 'Your appointment remains unchanged.'));
        container.appendChild(resultCard('Appointment', [
          ['Appointment ID', state.appointmentId],
          ['Patient', 'Demo Patient'],
          ['Department', state.existingDepartment],
          ['Date', state.existingDate],
          ['Time', state.existingTime],
          ['Status', 'Confirmed', 'demo-status-confirmed']
        ]));
        container.appendChild(tryAnotherActionBtn());
        return;
      }

      if (state.screen === 'cancel-result') {
        container.appendChild(el('p', 'demo-result-heading', '\u2713 Appointment Cancelled Successfully'));
        container.appendChild(resultCard('Appointment', [
          ['Appointment ID', state.appointmentId],
          ['Patient', 'Demo Patient'],
          ['Department', state.existingDepartment],
          ['Date', state.existingDate],
          ['Time', state.existingTime],
          ['Status', 'Cancelled', 'demo-status-cancelled']
        ]));
        container.appendChild(nextStepsBlock('What The Real System Does Next', [
          'Updates the appointment status',
          'Makes the slot available again',
          'Sends a cancellation confirmation',
          'Updates appointment records'
        ]));
        container.appendChild(tryAnotherActionBtn());
        return;
      }

            /* ---------- RETRIEVE ---------- */
      if (state.screen === 'retrieve-ask-id') {
        container.appendChild(
          el('p', 'demo-message', 'Do you have your appointment ID?')
        );

        container.appendChild(
          optionButtons(['Yes', 'No'], function (answer) {
            if (answer === 'Yes') {
              state.screen = 'retrieve-processing';
              render();

              setTimeout(function () {
                if (state.screen === 'retrieve-processing') {
                  state.screen = 'retrieve-found';
                  render();
                }
              }, 900);

            } else {
              state.screen = 'retrieve-noid-details';
              render();
            }
          })
        );

        return;
      }

      if (state.screen === 'retrieve-noid-details') {
        container.appendChild(
          el(
            'p',
            'demo-message',
            'No problem. I can help retrieve your appointment using other information.'
          )
        );

        var useSampleBtnRetrieve = el(
          'button',
          'btn btn-primary',
          'Use Sample Patient Details →'
        );

        useSampleBtnRetrieve.type = 'button';

        useSampleBtnRetrieve.addEventListener('click', function () {
          state.patientName = 'Demo Patient';
          state.patientEmail = 'patient@example.com';
          state.patientPhone = '0800 000 0000';

          state.screen = 'retrieve-noid-review';
          render();
        });

        container.appendChild(useSampleBtnRetrieve);
        return;
      }

      if (state.screen === 'retrieve-noid-review') {
        container.appendChild(
          el(
            'p',
            'demo-message',
            'Here are the sample patient details I’ll use to search:'
          )
        );

        container.appendChild(
          resultCard('Patient Details', [
            ['Name', state.patientName],
            ['Email', state.patientEmail],
            ['Phone', state.patientPhone]
          ])
        );

        var findBtnRetrieve = el(
          'button',
          'btn btn-primary',
          'Find Appointment →'
        );

        findBtnRetrieve.type = 'button';

        findBtnRetrieve.addEventListener('click', function () {
          state.screen = 'retrieve-processing';
          render();

          setTimeout(function () {
            if (state.screen === 'retrieve-processing') {
              state.screen = 'retrieve-found';
              render();
            }
          }, 900);
        });

        container.appendChild(findBtnRetrieve);
        return;
      }

      if (state.screen === 'retrieve-processing') {
        container.appendChild(el('p', 'demo-processing', 'Finding your appointment\u2026'));
        return;
      }

      if (state.screen === 'retrieve-found') {
        container.appendChild(el('p', 'demo-result-heading', '\u2713 Appointment Found'));
        container.appendChild(resultCard('Appointment', [
          ['Appointment ID', state.appointmentId],
          ['Patient', 'Demo Patient'],
          ['Department', state.existingDepartment],
          ['Date', state.existingDate],
          ['Time', state.existingTime],
          ['Status', 'Confirmed', 'demo-status-confirmed']
        ]));
        var actions2 = el('div', 'demo-actions');
        var rescheduleBtn = el('button', 'btn btn-secondary', 'Reschedule');
        rescheduleBtn.type = 'button';
        rescheduleBtn.addEventListener('click', function () {
          state.screen = 'reschedule-current';
          render();
        });
        var cancelBtn2 = el('button', 'btn btn-secondary', 'Cancel');
        cancelBtn2.type = 'button';
        cancelBtn2.addEventListener('click', function () {
          state.appointmentStatus = 'Confirmed';
          state.screen = 'cancel-show';
          render();
        });
        var menuBtn = el('button', 'btn btn-secondary', 'Main Menu');
        menuBtn.type = 'button';
        menuBtn.addEventListener('click', backToMenu);
        actions2.appendChild(rescheduleBtn);
        actions2.appendChild(cancelBtn2);
        actions2.appendChild(menuBtn);
        container.appendChild(actions2);

        container.appendChild(nextStepsBlock('What The Real System Does', [
          'Searches appointment records',
          'Retrieves the matching appointment',
          'Can use alternative patient details when the appointment ID is unavailable',
          'Provides the next available appointment actions'
        ]));
        return;
      }
    }

    render();
  })();

  /* =========================================================
     CYBERVAST — B2B AI LEAD QUALIFICATION DEMO
     ========================================================= */
  (function initCybervast() {
    var container = document.getElementById('cybervastDemoBody');
    if (!container) return;

    var SERVICES = [
      'Corporate Employee Technology Training',
      'Cloud Migration Services',
      'Cybersecurity Services',
      'IT Consulting & Advisory',
      'Digital Transformation Support'
    ];
    var TIMELINES = [
      'Immediately',
      'Within 1 month',
      'Within 1\u20133 months',
      'Within 3\u20136 months',
      'More than 6 months from now',
      'No specific timeline yet'
    ];

    var STRONG_SIGNALS = ['need', 'require', 'implement', 'migrate', 'automate', 'train', 'training',
      'secure', 'security', 'improve', 'upgrade', 'deploy', 'integrate', 'digitize', 'digitalize',
      'as soon as possible', 'urgent', 'immediately', 'this month', 'project'];
    var EXPLORATORY_SIGNALS = ['just exploring', 'just checking', 'curious', 'maybe', 'not sure',
      'researching', 'no specific plan', 'sometime later', 'future'];

    function hasGenuineNeed(text) {
      var t = (text || '').trim().toLowerCase();
      if (t.length < 8) return false;
      var isExploratory = EXPLORATORY_SIGNALS.some(function (p) { return t.indexOf(p) !== -1; });
      var hasStrongSignal = STRONG_SIGNALS.some(function (p) { return t.indexOf(p) !== -1; });
      if (isExploratory && !hasStrongSignal) return false;
      if (hasStrongSignal) return true;
      return t.length >= 20;
    }

    // Deterministic rule-based classification — no randomness of any kind.
    function classifyLead(timeline, businessNeed) {
      if (timeline === 'More than 6 months from now' || timeline === 'No specific timeline yet') {
        return 'COLD';
      }
      var genuine = hasGenuineNeed(businessNeed);
      if (timeline === 'Immediately' || timeline === 'Within 1 month') {
        return genuine ? 'HOT' : 'WARM';
      }
      if (timeline === 'Within 1\u20133 months') {
        return genuine ? 'WARM' : 'COLD';
      }
      if (timeline === 'Within 3\u20136 months') {
        return genuine ? 'WARM' : 'COLD';
      }
      return 'COLD';
    }

    function el2(tag, className, html) { return el(tag, className, html); }

    function renderForm() {
      container.innerHTML = '';
      var form = document.createElement('form');
      form.setAttribute('novalidate', '');
      var grid = el2('div', 'demo-form-grid');

      function field(labelText, inputEl, fullWidth) {
        var wrap = el2('div', 'demo-field-group' + (fullWidth ? ' full-width' : ''));
        var label = document.createElement('label');
        label.textContent = labelText;
        var id = 'cyb-' + labelText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        label.setAttribute('for', id);
        inputEl.id = id;
        wrap.appendChild(label);
        wrap.appendChild(inputEl);
        return wrap;
      }

      var companyName = document.createElement('input');
companyName.type = 'text';
companyName.value = 'Northstar Technologies';

var contactPerson = document.createElement('input');
contactPerson.type = 'text';
contactPerson.value = 'Demo Prospect';

var emailAddress = document.createElement('input');
emailAddress.type = 'email';
emailAddress.value = 'prospect@example.com';

var phoneNumber = document.createElement('input');
phoneNumber.type = 'text';
phoneNumber.value = '0800 000 0000';

      var serviceRequired = document.createElement('select');
      serviceRequired.appendChild(new Option('Select a service', ''));
      SERVICES.forEach(function (s) { serviceRequired.appendChild(new Option(s, s)); });

      var businessNeed = document.createElement('textarea');
      businessNeed.rows = 4;
      businessNeed.placeholder = 'Briefly describe what you need help with…';

      var needTimeline = document.createElement('select');
      needTimeline.appendChild(new Option('Select a timeline', ''));
      TIMELINES.forEach(function (t) { needTimeline.appendChild(new Option(t, t)); });

      grid.appendChild(field('Company Name', companyName));
      grid.appendChild(field('Contact Person', contactPerson));
      grid.appendChild(field('Email Address', emailAddress));
      grid.appendChild(field('Phone Number', phoneNumber));
      grid.appendChild(field('Service Required', serviceRequired));
      grid.appendChild(field('Need Timeline', needTimeline));
      grid.appendChild(field('Business Need', businessNeed, true));

      form.appendChild(grid);

      var submitBtn = el2('button', 'btn btn-primary', 'Assess Lead \u2192');
      submitBtn.type = 'submit';
      submitBtn.style.marginTop = '20px';
      form.appendChild(submitBtn);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        renderProcessing(needTimeline.value, businessNeed.value);
      });

      container.appendChild(form);
    }

    function renderProcessing(timeline, businessNeed) {
      container.innerHTML = '';
      var steps = [
        'Reviewing enquiry\u2026',
        'Assessing business need\u2026',
        'Evaluating readiness\u2026',
        'Determining follow-up priority\u2026'
      ];
      var msg = el2('p', 'demo-processing', steps[0]);
      container.appendChild(msg);
      var i = 0;
      var interval = setInterval(function () {
        i++;
        if (i < steps.length) {
          msg.textContent = steps[i];
        } else {
          clearInterval(interval);
          var result = classifyLead(timeline, businessNeed);
          renderResult(result);
        }
      }, 350);
    }

    function renderResult(result) {
      container.innerHTML = '';

      var copy = {
        HOT: {
          label: 'Hot Lead',
          badgeClass: 'status-hot',
          assessment: 'This enquiry shows strong near-term readiness and requires timely sales attention.',
          action: 'Prioritize this lead for sales review and prompt follow-up.',
          nextSteps: [
            'Records the enquiry in Google Sheets',
            'Sends the prospect an email',
            'Sends a HOT lead notification to Slack',
            'Prioritizes the lead for sales attention'
          ]
        },
        WARM: {
          label: 'Warm Lead',
          badgeClass: 'status-warm',
          assessment: 'This enquiry shows genuine potential but may require continued engagement before progressing to an immediate sales opportunity.',
          action: 'Review the enquiry and continue appropriate follow-up with the prospect.',
          nextSteps: [
            'Records the enquiry in Google Sheets',
            'Sends the prospect an email',
            'Sends a WARM lead notification to Slack',
            'Places the lead into a follow-up path'
          ]
        },
        COLD: {
          label: 'Cold Lead',
          badgeClass: 'status-cold',
          assessment: 'This enquiry currently shows limited near-term readiness.',
          action: 'Keep the lead for future nurturing and allow the sales team to decide whether additional follow-up is appropriate.',
          nextSteps: [
            'Records the enquiry in Google Sheets',
            'Sends the prospect an email',
            'Retains the lead for future nurturing',
            'Does not send the HOT/WARM Slack alert'
          ]
        }
      };

      var c = copy[result];
      container.appendChild(el2('span', 'status-badge ' + c.badgeClass, c.label));

      var assessWrap = el2('div');
      var aTitle = el2('p', null, '<strong>AI Assessment</strong>');
      var aText = el2('p', null, c.assessment);
      aText.style.margin = '8px 0 16px';
      var rTitle = el2('p', null, '<strong>Recommended Action</strong>');
      var rText = el2('p', null, c.action);
      rText.style.margin = '8px 0 16px';
      assessWrap.appendChild(aTitle);
      assessWrap.appendChild(aText);
      assessWrap.appendChild(rTitle);
      assessWrap.appendChild(rText);
      container.appendChild(assessWrap);

      var disclaimer = el2('p', null, 'AI Recommendation \u00b7 Final qualification decision remains with the sales team');
      disclaimer.style.fontSize = '13px';
      disclaimer.style.color = 'var(--muted-blue)';
      disclaimer.style.marginBottom = '20px';
      container.appendChild(disclaimer);

      var flow = el2('div', 'demo-flow');
      ['Enquiry Received', 'Lead Recorded', 'AI Qualification', c.label.replace(' Lead', '').toUpperCase(), 'Appropriate Follow-Up Route'].forEach(function (step, idx, arr) {
        flow.appendChild(el2('span', null, step));
        if (idx < arr.length - 1) flow.appendChild(el2('span', 'flow-arrow', '\u2192'));
      });
      container.appendChild(flow);

      container.appendChild(nextStepsBlock('What The Real Workflow Does', c.nextSteps));

      if (result !== 'COLD') {
        // still show reset button for consistency, all results reset the same way
      }
      var resetBtn = el2('button', 'btn btn-primary', 'Try Another Lead \u2192');
      resetBtn.type = 'button';
      resetBtn.addEventListener('click', renderForm);
      container.appendChild(resetBtn);
    }

    function nextStepsBlock(title, items) {
      var box = el2('div', 'demo-next-steps');
      box.appendChild(el2('h4', null, title));
      var ul = el2('ul');
      items.forEach(function (i) { ul.appendChild(el2('li', null, i)); });
      box.appendChild(ul);
      return box;
    }

    renderForm();
  })();

  /* =========================================================
     INTERACTIVE WORKLOAD CALCULATOR
     ========================================================= */
  (function initCalculator() {
    var teamMembers = document.getElementById('teamMembers');
    var manualHours = document.getElementById('manualHours');
    var hourlyCost = document.getElementById('hourlyCost');
    var currencySelect = document.getElementById('currencySelect');
    if (!teamMembers) return;

    var teamMembersValue = document.getElementById('teamMembersValue');
    var manualHoursValue = document.getElementById('manualHoursValue');
    var hourlyCostValue = document.getElementById('hourlyCostValue');
    var resultWorkload = document.getElementById('resultWorkload');
    var resultMonthlyCost = document.getElementById('resultMonthlyCost');
    var resultAnnualCost = document.getElementById('resultAnnualCost');
    var automateBtn = document.getElementById('automateWorkloadBtn');

    var CURRENCY_CONFIG = {
      NGN: { symbol: '\u20a6', min: 1000, max: 50000, step: 1000, defaultValue: 10000 },
      USD: { symbol: '$', min: 5, max: 100, step: 5, defaultValue: 20 },
      GBP: { symbol: '\u00a3', min: 5, max: 100, step: 5, defaultValue: 20 },
      EUR: { symbol: '\u20ac', min: 5, max: 100, step: 5, defaultValue: 20 }
    };

    function formatCurrency(amount, currencyCode) {
      var symbol = CURRENCY_CONFIG[currencyCode].symbol;
      return symbol + Math.round(amount).toLocaleString('en-US');
    }

    function applyCurrencyConfig(code) {
      var cfg = CURRENCY_CONFIG[code];
      hourlyCost.min = cfg.min;
      hourlyCost.max = cfg.max;
      hourlyCost.step = cfg.step;
      hourlyCost.value = cfg.defaultValue;
    }

    function update() {
      var members = parseInt(teamMembers.value, 10);
      var hours = parseInt(manualHours.value, 10);
      var rate = parseInt(hourlyCost.value, 10);
      var currency = currencySelect.value;

      teamMembersValue.textContent = members;
      manualHoursValue.textContent = hours;
      hourlyCostValue.textContent = formatCurrency(rate, currency);

      var monthlyWorkload = members * hours;
      var monthlyCost = monthlyWorkload * rate;
      var annualCost = monthlyCost * 12;

      resultWorkload.textContent = monthlyWorkload.toLocaleString('en-US') + ' hours';
      resultMonthlyCost.textContent = formatCurrency(monthlyCost, currency);
      resultAnnualCost.textContent = formatCurrency(annualCost, currency);

      return { members: members, hours: hours, monthlyWorkload: monthlyWorkload, rate: rate, monthlyCost: monthlyCost, annualCost: annualCost, currency: currency };
    }

    currencySelect.addEventListener('change', function () {
      applyCurrencyConfig(currencySelect.value);
      update();
    });
    teamMembers.addEventListener('input', update);
    manualHours.addEventListener('input', update);
    hourlyCost.addEventListener('input', update);

    update();

    if (automateBtn) {
      automateBtn.addEventListener('click', function () {
        var values = update();
        window.__workloadEstimate = values;
        showWorkloadEstimate(values);
        document.getElementById('work-with-me').scrollIntoView({ behavior: 'smooth' });
      });
    }
  })();

  /* =========================================================
     WORKLOAD ESTIMATE CARD (Work With Me integration)
     ========================================================= */
  var workloadEstimateCard = document.getElementById('workloadEstimateCard');
  var workloadEstimateList = document.getElementById('workloadEstimateList');
  var removeEstimateBtn = document.getElementById('removeEstimateBtn');

  function currencyLabel(code) {
    return { NGN: '\u20a6', USD: '$', GBP: '\u00a3', EUR: '\u20ac' }[code] || '';
  }

  function showWorkloadEstimate(values) {
    if (!workloadEstimateCard) return;
    workloadEstimateList.innerHTML = '';
    var rows = [
      ['Currency', values.currency],
      ['Team Members', values.members],
      ['Hours Per Person / Month', values.hours],
      ['Monthly Manual Hours', values.monthlyWorkload.toLocaleString('en-US') + ' hours'],
      ['Hourly Cost', currencyLabel(values.currency) + values.rate.toLocaleString('en-US')],
      ['Monthly Labour Cost', currencyLabel(values.currency) + Math.round(values.monthlyCost).toLocaleString('en-US')],
      ['Annual Labour Cost', currencyLabel(values.currency) + Math.round(values.annualCost).toLocaleString('en-US')]
    ];
    rows.forEach(function (r) {
      var row = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      row.appendChild(dt); row.appendChild(dd);
      workloadEstimateList.appendChild(row);
    });
    workloadEstimateCard.hidden = false;
  }

  if (removeEstimateBtn) {
    removeEstimateBtn.addEventListener('click', function () {
      workloadEstimateCard.hidden = true;
      window.__workloadEstimate = null;
    });
  }

  /* =========================================================
   WORK WITH ME — ENQUIRY FORM
   Connected to the LydAutomation n8n enquiry workflow.
   ========================================================= */
  var WEBHOOK_URL = 'https://lydautomation-n8n.duckdns.org/webhook/website-enquiry';

  var enquiryForm = document.getElementById('enquiryForm');
if (enquiryForm) {
  var formStatus = document.getElementById('formStatus');

  // International phone field
  var phoneInput = document.getElementById('phone');
  var iti = null;

  if (phoneInput && window.intlTelInput) {
    iti = window.intlTelInput(phoneInput, {
      initialCountry: 'ng',
      preferredCountries: ['ng', 'gb', 'us', 'ca', 'gh'],
      separateDialCode: true,
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js'
    });
  }

  function isPhoneValid() {
    if (!phoneInput || !phoneInput.value.trim()) return false;
    if (!iti) return false;
    return iti.isValidNumber();
  }

    function setFieldError(fieldId, errorId, message) {
      var field = document.getElementById(fieldId);
      var errorEl = document.getElementById(errorId);
      var row = field.closest('.form-row');
      if (message) {
        row.classList.add('has-error');
        errorEl.textContent = message;
      } else {
        row.classList.remove('has-error');
        errorEl.textContent = '';
      }
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    enquiryForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot spam check — if filled, silently drop the submission.
      var honeypot = document.getElementById('website');
      if (honeypot && honeypot.value.trim() !== '') {
        formStatus.textContent = '';
        return;
      }

      var fullName = document.getElementById('fullName');
      var email = document.getElementById('email');
      var describesYou = document.getElementById('describesYou');
      var lookingFor = document.getElementById('lookingFor');

      var isValid = true;

      if (!fullName.value.trim()) {
        setFieldError('fullName', 'fullNameError', 'Please enter your name.');
        isValid = false;
      } else {
        setFieldError('fullName', 'fullNameError', '');
      }

      if (!email.value.trim() || !isValidEmail(email.value.trim())) {
        setFieldError('email', 'emailError', 'Please enter a valid email address.');
        isValid = false;
      } else {
        setFieldError('email', 'emailError', '');
      }

      if (!isPhoneValid()) {
  setFieldError('phone', 'phoneError', 'Please enter a valid phone number.');
  isValid = false;
} else {
  setFieldError('phone', 'phoneError', '');
}

if (!describesYou.value) {
  setFieldError('describesYou', 'describesYouError', 'Please select an option.');
  isValid = false;
} else {
  setFieldError('describesYou', 'describesYouError', '');
}

      if (!lookingFor.value) {
        setFieldError('lookingFor', 'lookingForError', 'Please select an option.');
        isValid = false;
      } else {
        setFieldError('lookingFor', 'lookingForError', '');
      }

      if (!isValid) {
        formStatus.textContent = 'Please complete the required fields above.';
        formStatus.style.background = '#FDEBEA';
        formStatus.style.color = '#B3271E';
        return;
      }

            var submitButton = enquiryForm.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
      }

      formStatus.style.background = '';
      formStatus.style.color = '';
      formStatus.textContent = 'Sending your enquiry…';

      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
  fullName: fullName.value.trim(),
  email: email.value.trim(),
  phone: (iti && phoneInput && phoneInput.value.trim()) ? iti.getNumber() : '',
  companyOrg: document.getElementById('companyOrg').value.trim(),
  describesYou: describesYou.value,
  lookingFor: lookingFor.value,
  toolsUsed: document.getElementById('toolsUsed').value.trim(),
  manualProcess: document.getElementById('manualProcess').value.trim(),
  automationGoal: document.getElementById('automationGoal').value.trim(),
  workloadEstimate: window.__workloadEstimate || null
})
})
 .then(function (response) {
  if (!response.ok) {
    throw new Error('Request failed');
  }

          formStatus.style.background = '#E9F8FA';
          formStatus.style.color = '#000052';
          formStatus.textContent = 'Thank you — your enquiry has been received. I’ll be in touch soon.';

          enquiryForm.reset();

          if (window.__workloadEstimate) {
            window.__workloadEstimate = null;
          }
        })
        .catch(function () {
          formStatus.style.background = '#FDEBEA';
          formStatus.style.color = '#B3271E';
          formStatus.textContent = 'Something went wrong sending your enquiry. Please try again, or email Lydiaogbeneodey@gmail.com directly.';
        })
        .finally(function () {
          if (submitButton) {
            submitButton.disabled = false;
          }
        });
           });
  }

});
