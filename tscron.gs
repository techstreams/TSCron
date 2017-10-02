/*
* Copyright Laura Taylor
* (https://github.com/techstreams/TSCron)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
 */

/*
 * Add a custom menu to the active form
 */
function onOpen() {
   FormApp.getUi().createMenu('TSCron')
          .addItem('🕜 Configure', 'enableCron')
          .addItem('❌ Stop', 'stopCron')
          .addItem('👓 Status', 'showStatus')
          .addToUi();
};

/*
 * Enable form submit trigger
 */
function enableCron() {
   var tscron = new TSCron(moment(), FormApp.getActiveForm());
   tscron.enableCron();
   FormApp.getUi().alert('TSCron Configuration Complete.\nSubmit a response to the form to start TSCron.\n\nClick "Ok" to continue.');
};

/*
 * Stop cron scheduler
 */
function stopCron() {
  var response, tscron, ui;
  ui = FormApp.getUi();
  response = ui.alert(' ', 'TSCron will stop any currently running cron jobs.\n\nWould you like to continue?', FormApp.getUi().ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    tscron = new TSCron(moment(), FormApp.getActiveForm());
    tscron.stopCron();
    ui.alert('TSCron stopped all currently running cron jobs.\n\nClick "Ok" to continue');
  } else {
    ui.alert('TSCron "Stop" action was canceled.\n\nClick "Ok" to continue');
  }
};

/*
 * Schedule a new cron when a new form response is submitted
 * @param {Object} trigger event object
 */
function newTSCron(e) {
  var resp = e.response;
  var form = e.source;
  var tscron = new TSCron(moment(), form, resp);
  tscron.newTSCron();
};

/*
 * Start a scheduled cron on its associated start date
 * @param {Object} trigger event object
 */
function startTSCron(e) {
  var form = FormApp.getActiveForm();
  var tscron = new TSCron(moment(), form);
  tscron.startTSCron(e);
  cronJob(e, tscron.getUserDefinedItemResponses());
};

/*
 * Reschedule cron on its associated time schedule and call user defined "cronJob()" function
 * @param {Object} trigger event object
 */
function runTSCron(e) {
  var form = FormApp.getActiveForm();
  var tscron = new TSCron(moment(), form);
  tscron.runTSCron(e);
  cronJob(e, tscron.getUserDefinedItemResponses());
};

/*
 * End cron on its associated end date
 * @param {Object} trigger event object
 */
function endTSCron(e) {
  var form = FormApp.getActiveForm();
  var tscron = new TSCron(moment(), form);
  tscron.endTSCron();
};

/*
 * Show cron scheduler status
 */
function showStatus() {
  var tscron = new TSCron(moment(), FormApp.getActiveForm());
  tscron.showStatus();
};

/*
 * TSCron
 * Assumes moment.js global object available
 */
(function() {

  /*
   * TSCron
   * @class
   */
  return this.TSCron = (function() {

    /*
     * @constructor
     * @param {Moment} now - Moment which represents the time the constructor is called
     * @param {Form} form - current Form object
     * @param {FormResponse} response - current Form Response object
     * @return {TSCron} this object for chaining
     */
    function TSCron(now, form, response1) {
      this.now = now;
      this.form = form;
      this.response = response1 != null ? response1 : null;
      this.config = null;
      this.firstFormCronElement = 'Run TSCron';
      this.formSubmitFunction = 'newTSCron';
      this.cronFunction = 'runTSCron';
      this.startFunction = 'startTSCron';
      this.endFunction = 'endTSCron';
      this.propertiesKey = 'tscron';
      this;
    }


    /*
     * Schedule a new cron when a new form response is submitted
     * @return {TSCron} this object for chaining
     */

    TSCron.prototype.newTSCron = function() {
      var err;
      try {
        this.stopCron();
        this.config = this.getCronConfigFromForm_();
        if (this.config) {
          this.determineStartEndDates_();
          this.setScriptProperties_();
        } else {
          Logger.log('TSCron.configureNewCronJob(): Unable to get TSCron configuration from form submission.');
          throw new Error('TSCron.configureNewCronJob(): Unable to get TSCron configuration from form submission.');
        }
      } catch (error) {
        err = error;
        this.stopCron();
        this.sendErrorMsg_(err);
      }
      return this;
    };


    /*
     * Enable form submit trigger
     * @return {TSCron} this object for chaining
     */

    TSCron.prototype.enableCron = function() {
      var cronSubmitTriggers;
      cronSubmitTriggers = ScriptApp.getProjectTriggers().filter((function(_this) {
        return function(trigger) {
          return trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT && trigger.getHandlerFunction() === _this.formSubmitFunction;
        };
      })(this));
      if (cronSubmitTriggers.length < 1) {
        cronSubmitTriggers.push(ScriptApp.newTrigger(this.formSubmitFunction).forForm(this.form).onFormSubmit().create());
      }
      if (cronSubmitTriggers.length > 1) {
        cronSubmitTriggers.forEach((function(_this) {
          return function(trigger, index) {
            if (index > 0) {
              return ScriptApp.deleteTrigger(trigger);
            }
          };
        })(this));
      }
      return this;
    };


    /*
     * End Cron Job
     * @param {Object} e - trigger event object
     * @return {TSCron} this object for chaining
     */

    TSCron.prototype.endTSCron = function(e) {
      this.deleteTriggers_(ScriptApp.EventType.CLOCK, this.cronFunction);
      this.deleteTriggers_(ScriptApp.EventType.CLOCK, this.endFunction);
      return this;
    };


    /*
     * Get User Defined Item Responses
     * @return {Array<ItemResponses>} array of user defined ItemResponses from last form submit
     */

    TSCron.prototype.getUserDefinedItemResponses = function() {
      var err, getStartIndex_, response, startIndex, userItemResponses;
      try {
        getStartIndex_ = (function(_this) {
          return function(itemResponses) {
            var startIndex;
            startIndex = 0;
            itemResponses.forEach(function(itemResponse, index) {
              if (itemResponse.getItem().getTitle() === _this.firstFormCronElement) {
                return startIndex = index;
              }
            });
            return startIndex;
          };
        })(this);
        userItemResponses = [];
        response = this.form.getResponse(this.config.id);
        if (response) {
          startIndex = getStartIndex_(response.getItemResponses());
          response.getItemResponses().forEach((function(_this) {
            return function(itemResponse, index) {
              if (index < startIndex) {
                return userItemResponses.push(itemResponse);
              }
            };
          })(this));
          if (userItemResponses.length > 0) {
            return userItemResponses;
          } else {
            return null;
          }
        } else {
          Logger.log('TSCron.getUserDefinedItemResponses(): No Form Response Exists');
          throw new Error('TSCron.getUserDefinedItemResponses(): No Form Response Exists');
        }
      } catch (error) {
        err = error;
        this.stopCron();
        this.sendErrorMsg_(err);
        return null;
      }
    };


    /*
     * Run Cron Job
     * @param {Object} e - trigger event object
     * @return {TSCron} this object for chaining
     */

    TSCron.prototype.runTSCron = function(e) {
      this.scheduleTSCron_(e);
      return this;
    };


    /*
     * Start Cron Job
     * @param {Object} e - trigger event object
     * @return {TSCron} this object for chaining
     */

    TSCron.prototype.startTSCron = function(e) {
      this.deleteTriggers_(ScriptApp.EventType.CLOCK, this.startFunction);
      this.scheduleTSCron_(e);
      return this;
    };


    /*
     * Show cron scheduler status dashboard
     * @return {TSCron} this object for chaining
     */

    TSCron.prototype.showStatus = function() {
      var endTriggers, runTriggers, scheduleTriggers, scriptProperties, statusConfig, submitTriggers, template, ui;
      statusConfig = new Object();
      scriptProperties = this.getScriptProperties_();
      submitTriggers = ScriptApp.getProjectTriggers().filter((function(_this) {
        return function(trigger) {
          return trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT && trigger.getHandlerFunction() === _this.formSubmitFunction;
        };
      })(this));
      scheduleTriggers = ScriptApp.getProjectTriggers().filter((function(_this) {
        return function(trigger) {
          return trigger.getEventType() === ScriptApp.EventType.CLOCK && trigger.getHandlerFunction() === _this.startFunction && scriptProperties;
        };
      })(this));
      runTriggers = ScriptApp.getProjectTriggers().filter((function(_this) {
        return function(trigger) {
          return trigger.getEventType() === ScriptApp.EventType.CLOCK && trigger.getHandlerFunction() === _this.cronFunction && scriptProperties;
        };
      })(this));
      endTriggers = ScriptApp.getProjectTriggers().filter((function(_this) {
        return function(trigger) {
          return trigger.getEventType() === ScriptApp.EventType.CLOCK && trigger.getHandlerFunction() === _this.endFunction;
        };
      })(this));
      statusConfig.enabled = submitTriggers.length >= 1 ? true : false;
      statusConfig.scheduled = scheduleTriggers.length >= 1 ? true : false;
      statusConfig.running = runTriggers.length >= 1 ? true : false;
      statusConfig.end = endTriggers.length >= 1 ? true : false;
      if (statusConfig.scheduled || statusConfig.running) {
        statusConfig.schedule = this.getDashboardSchedule_(scriptProperties);
        statusConfig.last = scriptProperties.last ? moment.utc(scriptProperties.last).tz(Session.getScriptTimeZone()).format('MMMM D, YYYY h:mm A (z)') : null;
        statusConfig.next = scriptProperties.next ? moment.utc(scriptProperties.next).tz(Session.getScriptTimeZone()).format('MMMM D, YYYY h:mm A (z)') : null;
        statusConfig.created = moment.utc(scriptProperties.created).tz(Session.getScriptTimeZone()).format('MMMM D, YYYY h:mm A (z)');
      } else {
        statusConfig.schedule = null;
        statusConfig.last = null;
        statusConfig.next = null;
        statusConfig.created = null;
      }
      template = HtmlService.createTemplateFromFile('dashboard');
      template.display = statusConfig;
      ui = template.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).setTitle('TSCron Status');
      FormApp.getUi().showSidebar(ui);
      return this;
    };


    /*
     * Stop scheduled cron by deleting all cron time-based triggers
     * @return {TSCron} this object for chaining
     */

    TSCron.prototype.stopCron = function() {
      ScriptApp.getProjectTriggers().forEach((function(_this) {
        return function(trigger) {
          if (trigger.getEventType() === ScriptApp.EventType.CLOCK && trigger.getHandlerFunction().lastIndexOf('TSCron') >= 0) {
            return ScriptApp.deleteTrigger(trigger);
          }
        };
      })(this));
      PropertiesService.getScriptProperties().deleteProperty(this.propertiesKey);
      return this;
    };


    /*
     * Delete triggers by type and name of handler function
     * @param {ScriptApp.EventType} type - type of trigger
     * @param {string} functionName - name of trigger handler function
     * @return {TSCron} this object for chaining
     * @private
     */

    TSCron.prototype.deleteTriggers_ = function(type, functionName) {
      ScriptApp.getProjectTriggers().forEach((function(_this) {
        return function(trigger) {
          if (trigger.getEventType() === type && trigger.getHandlerFunction() === functionName) {
            return ScriptApp.deleteTrigger(trigger);
          }
        };
      })(this));
      return this;
    };


    /*
     * Determine type of cron scheduling and schedule cron
     * @param {Object} e - event object
     * @return {TSCron} this object for chaining
     * @private
     */

    TSCron.prototype.detemineCronAction_ = function(e) {
      var createTimeTrigger_, duration, endOfNextMonth, lastScheduled, next, startDate, startOfNextMonth;
      createTimeTrigger_ = (function(_this) {
        return function(duration, param) {
          var next;
          if (_this.config.next) {
            next = moment.tz(_this.config.next, Session.getScriptTimeZone()).add(duration);
          } else {
            next = moment.tz(param, Session.getScriptTimeZone()).add(duration);
          }
          ScriptApp.newTrigger(_this.cronFunction).timeBased().at(next.toDate()).create();
          return _this.config.next = next.utc().valueOf();
        };
      })(this);
      this.deleteTriggers_(ScriptApp.EventType.CLOCK, this.cronFunction);
      switch (this.config.action) {
        case 'Every Minutes':
          duration = moment.duration(parseInt(this.config.params[0], 10), 'm');
          ScriptApp.newTrigger(this.cronFunction).timeBased().after(duration).create();
          this.config.next = moment.utc({
            y: e.year,
            M: e.month - 1,
            d: e['day-of-month'],
            h: e.hour,
            m: e.minute
          }).add(duration).valueOf();
          break;
        case 'Every Hours':
          duration = moment.duration(Math.round(this.config.params[0]), 'h');
          createTimeTrigger_(duration, this.config.params[1]);
          break;
        case 'Every Days':
          duration = moment.duration(Math.round(this.config.params[0]), 'd');
          createTimeTrigger_(duration, this.config.params[1]);
          break;
        case 'Every Weeks':
          duration = moment.duration(Math.round(this.config.params[0]), 'w');
          createTimeTrigger_(duration, this.config.params[1]);
          break;
        case 'Every Months':
          duration = moment.duration(Math.round(this.config.params[0]), 'M');
          startDate = moment.tz(this.config.params[2], Session.getScriptTimeZone());
          if (this.config.next) {
            lastScheduled = moment.tz(this.config.next, Session.getScriptTimeZone());
          } else {
            lastScheduled = moment.tz(this.config.params[2], Session.getScriptTimeZone());
          }
          startOfNextMonth = lastScheduled.clone().startOf('M').add(duration);
          endOfNextMonth = startOfNextMonth.clone().endOf('M');
          if ((startDate.date() < 28) || ((startDate.date() <= endOfNextMonth.date()) && !(this.isShortMonth_(startDate) && this.isLastDayOfMonth_(startDate) && this.config.params[1] === 'Yes'))) {
            next = startOfNextMonth.clone().date(startDate.date()).hour(lastScheduled.hour()).minute(lastScheduled.minute());
          } else {
            next = endOfNextMonth.clone().hour(lastScheduled.hour()).minute(lastScheduled.minute());
          }
          ScriptApp.newTrigger(this.cronFunction).timeBased().at(next.toDate()).create();
          this.config.next = next.utc().valueOf();
          break;
        case 'Every Years':
          duration = moment.duration(Math.round(this.config.params[0]), 'y');
          startDate = moment.tz(this.config.params[2], Session.getScriptTimeZone());
          if (this.config.next) {
            lastScheduled = moment.tz(this.config.next, Session.getScriptTimeZone());
          } else {
            lastScheduled = moment.tz(this.config.params[2], Session.getScriptTimeZone());
          }
          if (startDate.month() === 1 && startDate.date() >= 28 && this.config.params[1] === 'Yes') {
            next = lastScheduled.clone().add(duration).startOf('y').add(1, 'M').endOf('M').hour(lastScheduled.hour()).minute(lastScheduled.minute());
          } else {
            next = lastScheduled.clone().add(duration).hour(lastScheduled.hour()).minute(lastScheduled.minute());
          }
          ScriptApp.newTrigger(this.cronFunction).timeBased().at(next.toDate()).create();
          this.config.next = next.utc().valueOf();
          break;
        case 'Custom':
          this.config.next = null;
          break;
      }
      return this;
    };


    /*
     * Determine cron start and end dates and schedule cron time-based triggers
     * @return {TSCron} this object for chaining
     * @private
     */

    TSCron.prototype.determineStartEndDates_ = function() {
      var scheduleDates_;
      scheduleDates_ = (function(_this) {
        return function(start, end) {
          var endDate, startDate;
          startDate = moment.tz(start, Session.getScriptTimeZone());
          if (end) {
            endDate = moment.tz(end, Session.getScriptTimeZone());
          }
          if (startDate.isSameOrAfter(_this.now.clone().add(15, 'm'), 'm') && !endDate) {
            return ScriptApp.newTrigger(_this.startFunction).timeBased().at(startDate.toDate()).create();
          } else if (startDate.isSameOrAfter(_this.now.clone().add(15, 'm'), 'm') && endDate.isSameOrAfter(startDate.clone().add(1, 'h'))) {
            ScriptApp.newTrigger(_this.startFunction).timeBased().at(startDate.toDate()).create();
            return ScriptApp.newTrigger(_this.endFunction).timeBased().at(endDate.toDate()).create();
          } else {
            Logger.log('TSCron.determineStartEndDates(): Unable to schedule cron because of invalid start/end date configuration');
            throw new Error('TSCron.determineStartEndDates(): Unable to schedule cron because of invalid start/end date configuration');
          }
        };
      })(this);
      switch (this.config.action) {
        case 'Every Minutes':
        case 'Every Hours':
        case 'Every Days':
        case 'Every Weeks':
          scheduleDates_(this.config.params[1], this.config.params[2] ? this.config.params[2] : null);
          break;
        case 'Every Months':
        case 'Every Years':
          scheduleDates_(this.config.params[2], this.config.params[3] ? this.config.params[3] : null);
          break;
        case 'Custom':
          scheduleDates_(this.config.params[0], null);
          break;
      }
      return this;
    };


    /*
     * Find first form cron configuration element based on its item name
     * @param {string} title - title of first form cron configuration element
     * @return {number} index of first form cron confiugration element
     * @private
     */

    TSCron.prototype.findFirstCronFormElement_ = function(title) {
      var cronStartIndex;
      cronStartIndex = null;
      if (this.response) {
        this.response.getItemResponses().forEach(function(item, index) {
          if (item.getItem().getTitle() === title) {
            return cronStartIndex = index;
          }
        });
      } else {
        Logger.log('TSCron.findFirstCronFromElement(): No Form Response Exists');
        throw new Error('TSCron.findFirstCronFromElement(): No Form Response Exists');
      }
      if (cronStartIndex === null) {
        Logger.log('TSCron.findFirstCronFromElement(): No Cron Configuration Found');
        throw new Error('TSCron.findFirstCronFromElement(): No Cron Configuration Found');
      }
      return cronStartIndex;
    };


    /*
     * Get cron configuration from Form Item Responses
     * @return {Object} Cron configuration object
     * @private
     */

    TSCron.prototype.getCronConfigFromForm_ = function() {
      var config, itemResponses, startIndex;
      startIndex = this.findFirstCronFormElement_(this.firstFormCronElement);
      config = new Object();
      if (this.response) {
        itemResponses = this.response.getItemResponses();
        config.action = itemResponses[startIndex].getResponse();
        config.params = [];
        itemResponses.forEach((function(_this) {
          return function(item, index) {
            if (index > startIndex) {
              return config.params.push(item.getResponse());
            }
          };
        })(this));
        config.id = this.response.getId();
        config.created = moment.utc(this.response.getTimestamp()).valueOf();
      } else {
        Logger.log('TSCron.getCronConfigFromForm(): No Form Response Exists');
        throw new Error('TSCron.getCronConfigFromForm(): No Form Response Exists');
      }
      return config;
    };


    /*
     * Get cron scheduler status configuration
     * @param {Object} scriptProperties - cron scheduler properties object
     * @return {string} cron scheduler dashbaord schedule
     * @private
     */

    TSCron.prototype.getDashboardSchedule_ = function(scriptProperties) {
      var schedule, setSchedule_;
      schedule = new Object();
      setSchedule_ = (function(_this) {
        return function(s, props, scheduleStr) {
          var startDate;
          switch (scheduleStr) {
            case 'Minutes':
            case 'Hours':
            case 'Days':
            case 'Weeks':
              startDate = moment.tz(props.params[1], Session.getScriptTimeZone());
              s.start = startDate.format('MMMM D, YYYY h:mm A (z)');
              s.end = props.params[2] ? moment.tz(props.params[2], Session.getScriptTimeZone()).format('MMMM D, YYYY h:mm A (z)') : null;
              s.every = props.params[0] + ' ' + scheduleStr;
              break;
            case 'Months':
            case 'Years':
              startDate = moment.tz(props.params[2], Session.getScriptTimeZone());
              s.start = startDate.format('MMMM D, YYYY h:mm A (z)');
              s.end = props.params[3] ? moment.tz(props.params[3], Session.getScriptTimeZone()).format('MMMM D, YYYY h:mm A (z)') : null;
              s.every = props.params[0] + ' ' + scheduleStr;
              break;
            case 'Custom':
              startDate = moment.tz(props.params[0], Session.getScriptTimeZone());
              s.start = startDate.format('MMMM D, YYYY h:mm A (z)');
              s.end = null;
              s.every = scheduleStr + ' (run once)';
              break;
          }
          switch (scheduleStr) {
            case 'Minutes':
            case 'Hours':
            case 'Custom':
              return s.near = null;
            case 'Days':
              return s.near = startDate.format('h:mm A');
            case 'Weeks':
              return s.near = startDate.format('dddd @ h:mm A');
            case 'Months':
              if (_this.isShortMonth_(startDate) && _this.isLastDayOfMonth_(startDate) && props.params[1] === 'Yes') {
                return s.near = 'Last of Month' + startDate.format(' @ h:mm A');
              } else {
                return s.near = startDate.format('Do @ h:mm A');
              }
              break;
            case 'Years':
              if (startDate.month() === 1 && startDate.date() >= 28) {
                return s.near = 'Last Day Feb' + startDate.format(' @ h:mm A');
              } else {
                return s.near = startDate.format('MMM Do @ h:mm A');
              }
              break;
          }
        };
      })(this);
      switch (scriptProperties.action) {
        case 'Every Minutes':
          setSchedule_(schedule, scriptProperties, 'Minutes');
          break;
        case 'Every Hours':
          setSchedule_(schedule, scriptProperties, 'Hours');
          break;
        case 'Every Days':
          setSchedule_(schedule, scriptProperties, 'Days');
          break;
        case 'Every Weeks':
          setSchedule_(schedule, scriptProperties, 'Weeks');
          break;
        case 'Every Months':
          setSchedule_(schedule, scriptProperties, 'Months');
          break;
        case 'Every Years':
          setSchedule_(schedule, scriptProperties, 'Years');
          break;
        case 'Custom':
          setSchedule_(schedule, scriptProperties, 'Custom');
          break;
      }
      return schedule;
    };


    /*
     * Get properties object from Script Properties store
     * @return {Object} Script Properties store object
     * @private
     */

    TSCron.prototype.getScriptProperties_ = function() {
      return JSON.parse(PropertiesService.getScriptProperties().getProperty(this.propertiesKey));
    };


    /*
     * Determine if date is last day of month
     * @param {Moment} date - date to test
     * @return {boolean} if date is last day of month
     * @private
     */

    TSCron.prototype.isLastDayOfMonth_ = function(date) {
      if (date.clone().endOf('M').isSame(date.clone(), 'd')) {
        return true;
      } else {
        return false;
      }
    };


    /*
     * Determine if date is in a month with less than 31 days
     * @param {Moment} date - date to test
     * @return {boolean} if date is in a month with less than 31 days
     * @private
     */

    TSCron.prototype.isShortMonth_ = function(date) {
      var shortMonth;
      switch (date.month()) {
        case 1:
        case 3:
        case 5:
        case 8:
        case 10:
          shortMonth = true;
          break;
        default:
          shortMonth = false;
      }
      return shortMonth;
    };


    /*
     * Schedule cron
     * @param  {Object} e - trigger event object
     * @return {TSCron} this object for chaining
     */

    TSCron.prototype.scheduleTSCron_ = function(e) {
      var err;
      try {
        this.config = this.getScriptProperties_();
        if (this.config) {
          if (e) {
            this.config.last = moment.utc({
              y: e.year,
              M: e.month - 1,
              d: e['day-of-month'],
              h: e.hour,
              m: e.minute
            }).valueOf();
          }
          this.detemineCronAction_(e);
          this.setScriptProperties_();
        } else {
          Logger.log('TSCron.scheduleTSCron(): No Cron Configuration Exists in Script Properties');
          throw new Error('TSCron.scheduleTSCron(): No Cron Configuration Exists in Script Properties');
        }
      } catch (error) {
        err = error;
        this.stopCron();
        this.sendErrorMsg_(err);
      }
      return this;
    };


    /*
     * Send error email to form owner
     * @param {Error} err - error object
     * @return {TSCron} this object for chaining
     * @private
     */

    TSCron.prototype.sendErrorMsg_ = function(err) {
      var msg;
      msg = 'Cron Job Scheduler failed in form <a href="' + this.form.getEditUrl() + '"><strong>' + this.form.getTitle() + '</strong></a> with the following error message:<br><br>' + '<strong><em><span style="color:red;">' + err.message + '</span></em></strong>' + '<br><br><br>' + '<strong>The Cron Job Scheduler has been disabled.<br>Restart the Scheduler by submitting another form request.</strong><br><br><br>' + '<hr><em><a href="https://github.com/TSCron" target="__blank">TSCron</a> - a Google Forms based Cron scheduler powered by Google Apps Script</em>';
      GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Cron Job Schedule Failure', '', {
        htmlBody: msg
      });
      return this;
    };


    /*
     * Set object in Script Properties store
     * @return {TSCron} this object for chaining
     * @private
     */

    TSCron.prototype.setScriptProperties_ = function() {
      JSON.parse(PropertiesService.getScriptProperties().getProperty(this.propertiesKey));
      PropertiesService.getScriptProperties().setProperty(this.propertiesKey, JSON.stringify(this.config));
      return this;
    };

    return TSCron;

  })();
})();
