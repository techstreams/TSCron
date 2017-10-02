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

// Setup QUnit helpers with global object
QUnit.helpers(this);


/*
 * Create QUnit Testing Dashboard for Google Apps Script
 * See https://github.com/simula-innovation/qunit/tree/gas/gas for more information and setup instructions
 *
 * @param {Object} e - event object passed to doGet() method
 * @return {string} html of testing output
 */
function doGet(e) {
  QUnit.urlParams(e.parameter);
  QUnit.config({ title: 'Unit tests for TSCron' });
  QUnit.load(cases_);
  return QUnit.getHtml();
};


/*
 * TSCron Unit Tests Main Function
 *
 * To perform TSCRon unit testing, change the desired unit test configuration = "true" in the "testConfig" object below
 */
var cases_ = function() {

  // To perform TSCRon unit testing, change the desired unit test configuration = "true" in the "testConfig" object below
  var testConfig = {
    configuration: false,   // Test 'Configuration' Menu
    stop: false,            // Test 'Stop' Menu
    invalidstartend: false, // Test Invalid Start & End Dates
    everyminutes: false,    // Test 'Every Minutes' Cron Schedule
    everyhours: false,      // Test 'Every Hours' Cron Schedule
    everydays: false,       // Test 'Every Days' Cron Schedule
    everyweeks: false,      // Test 'Every Weeks' Cron Schedule
    everymonths: {
      standard: false,      // Test 'Every Months' Cron Schedule
      longno: false,        // Test 'Every Months' Cron Schedule - Start Day in a Long Month (Start Date Month Has 31 Days in Month) and "Short Months?" = "No"
      longyes: false,       // Test 'Every Months' Cron Schedule - Start Day in a Long Month (Start Date Month Has 31 Days in Month) and "Short Months?" = "Yes"
      shortno: false,       // Test 'Every Months' Cron Schedule - Start Day in a Short Month (Start Date Month Has < 31 days) and "Short Months?" = "No"
      shortyes: false,      // Test 'Every Months' Cron Schedule - Start Day in a Short Month (Start Date Month Has < 31 days) and "Short Months?" = "Yes"
      leapyear: false       // Test 'Every Months' Cron Schedule - Next Schedule Month is February in a Leap Year and Scheduled is Last Day of Month
    },
    everyyears: {
      standard: false,      // Test 'Every Years' Cron Schedule
      leapyear: false,      // Test 'Every Years' Cron Schedule - Schedule Date is February 29th in a Leap Year and Next Schedule Date is February 28th in non Leap Year
      leapyes: false,       // Test 'Every Years' Cron Schedule - Schedule Date is February 28th in a non Leap Year and "Leap Years?" = "Yes"
      leapno: false         // Test 'Every Years' Cron Schedule - Schedule Date is February 28th in a non Leap Year and "Leap Years?" = "No"
    },
    custom: {
      valid: false,         // Test 'Custom' Cron Schedule
      invalid: false        // Test Invalid 'Custom' Cron Schedule
    },
    runcron: false,          // Test running the cron job function
    initialCronJobFunction: 'newTSCron',
    additionalCronJobFunction: 'runTSCron',
    startCronJobFunction: 'startTSCron',
    endCronJobFunction: 'endTSCron',
    propsKey: 'tscron'

  }


  module('TSCron');


  // Test Configuration Menu
  if (testConfig.configuration === true) {
    test('Configuration Menu', function() {
      expect(2);

      var tscron = null;

      tscron = new TSCron(moment(), FormApp.getActiveForm());

      // Remove All Existing Submit Triggers
      TestUtil.deleteTriggers(ScriptApp.EventType.ON_FORM_SUBMIT, testConfig.initialCronJobFunction);

      // Test 'Configuration' Menu
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, '1 tscron form submit trigger exists after running configuration menu option');

      // Test creating mulitple form submit triggers
      ScriptApp.newTrigger(testConfig.initialCronJobFunction).forForm(FormApp.getActiveForm()).onFormSubmit().create();
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, '1 tscron form submit trigger exists after adding a second tscron form submit trigger');

    });
  }

  // Test Stop Cron Menu
  if (testConfig.stop === true) {
    test('Stop Menu', function() {
      expect(4);

      var tscron = null;

      tscron = new TSCron(moment(), FormApp.getActiveForm());

      // Remove All Existing Submit Triggers
      tscron.stopCron();
      TestUtil.deleteTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction);

      // Test 'Stop' Menu
      ScriptApp.newTrigger(testConfig.additionalCronJobFunction).timeBased().everyHours(1).create();
      tscron.stopCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, 'tscron hourly trigger deleted after running stop menu option');
      equal(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey), null, 'no "tscron" properties key exists after deleting hourly time trigger');

      // Test 'Stop' Menu for multiple time-based triggers
      ScriptApp.newTrigger(testConfig.additionalCronJobFunction).timeBased().everyHours(1).create();
      ScriptApp.newTrigger(testConfig.additionalCronJobFunction).timeBased().everyDays(1).atHour(8).nearMinute(10).create();
      tscron.stopCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, 'all tscron time-based triggers deleted after running stop menu option');
      equal(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey), null, 'no "tscron" properties key exists after deleting multiple time trigger');

    });
  }


  // Test invalidstartendInvalid Start/End Dates Cron Form Submission
  if (testConfig.invalidstartend === true) {
    test('Schedule Cron "Every Minutes" With Invalid Start/End Dates', function() {

      expect(7);

      var form = FormApp.getActiveForm(),
          now = moment(),
          response = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');
      tscron.stopCron();

      // Test Invalid Start Date with no End Date - Created from Form Submit
      TestUtil.createEveryMinute(form, ['Every Minutes', '30', now]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after form submit with invalid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form submit with invalid start date and no end date');

      // Test Valid Start Date with Invalid End Date - Created from Form Submit
      TestUtil.createEveryMinute(form, ['Every Minutes', '30', now.clone().add(30, 'm'), now.clone().add(30, 'm')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after form submit with valid start date and invalid end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form submit with valid start date and invalid end date');

      // Test Invalid Start Date with Invalid End Date - Created from Form Submit
      TestUtil.createEveryMinute(form, ['Every Minutes', '30', now, now.clone().add(45, 'm')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after form submit with invalid start date and invalid end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form submit with invalid start date and invalid end date');

      // Cleanup up any cron triggers
      tscron.stopCron();

    });
  }


  // Test "Every Minutes" Cron Form Submission
  if (testConfig.everyminutes === true) {
    test('Schedule Cron "Every Minutes"', function() {
      expect(19);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Valid Start Date with no End Date - Created from Form Submit
      TestUtil.createEveryMinute(form, ['Every Minutes', '30', now.clone().add(30,'m')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 1, '1 "startTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form submit with valid start date and no end date');

      // Test Valid Start Date and End Date - Created from Form Submit
      TestUtil.createEveryMinute(form, ['Every Minutes', '30', now.clone().add(30,'m'), now.clone().add(2, 'h')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 1, '1 "startTSCron" time-based triggers exist after form submit with valid start date and end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after form submit with valid start date and end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form submit with valid start date and end date');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryMinute(form, ['Every Minutes', '30', now.clone().add(30,'m'), now.clone().add(2, 'h')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Minutes",
        params:["30", now.clone().add(30,'m').format('YYYY-MM-DD kk:mm'), now.clone().add(2, 'h').format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Minutes" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 30 Minutes"
      event = TestUtil.getUTCEvent(now.clone().add(30,'m').utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');

      // Test Reschedule Cron "Every 30 Minutes"
      event = TestUtil.getUTCEvent(now.clone().add(60,'m').utc());
      tscron.runTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after reschedule trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after reschedule');

      // Test End Cron
      event = TestUtil.getUTCEvent(now.clone().add(2,'h').utc());
      tscron.endTSCron(event);
      Utilities.sleep(20000);
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form end date trigger');

      // Cleanup up cron triggers
      tscron.stopCron();


    });
  }


  // Test "Every Hours" Cron Form Submission
  if (testConfig.everyhours === true) {
    test('Schedule Cron "Every Hours"', function() {
      expect(19);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Valid Start Date with no End Date - Created from Form Submit
      TestUtil.createEveryHour(form, ['Every Hours', '3', now.clone().add(30,'m')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 1, '1 "startTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form submit with valid start date and no end date');

      // Test Valid Start Date and End Date - Created from Form Submit
      TestUtil.createEveryHour(form, ['Every Minutes', '30', now.clone().add(30,'m'), now.clone().add(2, 'd')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 1, '1 "startTSCron" time-based triggers exist after form submit with valid start date and end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after form submit with valid start date and end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form submit with valid start date and end date');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryHour(form, ['Every Hours', '3', now.clone().add(30,'m'), now.clone().add(2, 'd')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Hours",
        params:["3", now.clone().add(30,'m').format('YYYY-MM-DD kk:mm'), now.clone().add(2, 'd').format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Hours" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 3 Hours"
      event = TestUtil.getUTCEvent(now.clone().add(30,'m').utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist" after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');

      // Test Reschedule Cron "Every 3 Hours"
      event = TestUtil.getUTCEvent(now.clone().add(30, 'm').add(3, 'h').utc());
      tscron.runTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after reschedule trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after reschedule');

      // Test End Cron
      event = TestUtil.getUTCEvent(now.clone().add(2,'d').utc());
      tscron.endTSCron(event);
      Utilities.sleep(20000);
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form end date trigger');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }


  // Test "Every Days" Cron Form Submission
  if (testConfig.everydays === true) {
    test('Schedule Cron "Every Days"', function() {
      expect(19);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Valid Start Date with no End Date - Created from Form Submit
      TestUtil.createEveryDay(form, ['Every Days', '3', now.clone().add(30,'m')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 1, '1 "startTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form submit with valid start date and no end date');

      // Test Valid Start Date and End Date - Created from Form Submit
      TestUtil.createEveryDay(form, ['Every Days', '3', now.clone().add(30,'m'), now.clone().add(1, 'w')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 1, '1 "startTSCron" time-based triggers exist after form submit with valid start date and end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after form submit with valid start date and end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form submit with valid start date and end date');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryDay(form, ['Every Days', '3', now.clone().add(30,'m'), now.clone().add(1, 'w')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Days",
        params:["3", now.clone().add(30,'m').format('YYYY-MM-DD kk:mm'), now.clone().add(1, 'w').format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Days" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 3 Days"
      event = TestUtil.getUTCEvent(now.clone().add(30,'m').utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');


      // Test Reschedule Cron "Every 3 Days"
      event = TestUtil.getUTCEvent(now.clone().add(30, 'm').add(3, 'd').utc());
      tscron.runTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after reschedule trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after reschedule');

      // Test End Cron
      event = TestUtil.getUTCEvent(now.clone().add(1,'w').utc());
      tscron.endTSCron(event);
      Utilities.sleep(20000);
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form end date trigger');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }


  // Test "Every Weeks" Cron Form Submission
  if (testConfig.everyweeks === true) {
    test('Schedule Cron "Every Weeks"', function() {
      expect(16);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Valid Start Date with no End Date - Created from Form Submit
      TestUtil.createEveryWeeks(form, ['Every Weeks', '3', now.clone().add(30,'m')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 1, '1 "startTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form start date trigger');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryWeeks(form, ['Every Weeks', '3', now.clone().add(30,'m'), now.clone().add(2, 'M')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Weeks",
        params:["3", now.clone().add(30,'m').format('YYYY-MM-DD kk:mm'), now.clone().add(2, 'M').format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Weeks" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 3 Weeks"
      event = TestUtil.getUTCEvent(now.clone().add(30,'m').utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');

     // Test Reschedule Cron "Every 3 Weeks"
      event = TestUtil.getUTCEvent(now.clone().add(30, 'm').add(3, 'w').utc());
      tscron.runTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after reschedule trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after reschedule');

      // Test End Cron
      event = TestUtil.getUTCEvent(now.clone().add(2,'M').utc());
      tscron.endTSCron(event);
      Utilities.sleep(20000);
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form end date trigger');

      // Cleanup up cron triggers
     tscron.stopCron();


    });
  }


  // Test "Every Months" Cron Form Submission
  if (testConfig.everymonths.standard === true) {
    test('Schedule Cron "Every Months"', function() {
      expect(16);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Valid Start Date with no End Date - Created from Form Submit
      TestUtil.createEveryMonths(form, ['Every Months', '3', 'No', now.clone().add(30,'m')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 1, '1 "startTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form start date trigger');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryMonths(form, ['Every Months', '3', 'No', now.clone().add(30,'m'), now.clone().add(2, 'y')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Months",
        params:["3", "No", now.clone().add(30,'m').format('YYYY-MM-DD kk:mm'), now.clone().add(2, 'y').format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Months" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 3 Months"
      event = TestUtil.getUTCEvent(now.clone().add(30,'m').utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');

      // Test Reschedule Cron "Every 3 Months"
      event = TestUtil.getUTCEvent(now.clone().add(30, 'm').add(3, 'M').utc());
      tscron.runTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after reschedule trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after reschedule');

      // Test End Cron
      event = TestUtil.getUTCEvent(now.clone().add(2,'y').utc());
      tscron.endTSCron(event);
      Utilities.sleep(20000);
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist" after end date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist" after form end date trigger');

      // Cleanup up cron triggers
     tscron.stopCron();

    });
  }


 // Test "Every Months" Where Start Date is in a Long Month (Long Month Has 31 Days) and "Short Months?" = "No"
  if (testConfig.everymonths.longno === true) {
    test('Schedule Cron Job "Every Months" Where Start Date is in Long Month (Has 31 Days) and "Short Months?" Form Response = "No"', function() {
      expect(12);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryMonths(form, ['Every Months', '1', 'No', now.clone().add(1,'y').startOf('year').date(31).hour(13), now.clone().add(1,'y').endOf('year').hour(13).minute(0)]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Months",
        params:["1", "No", now.clone().add(1,'y').startOf('year').date(31).hour(13).format('YYYY-MM-DD kk:mm'), now.clone().add(1,'y').endOf('year').hour(13).minute(0).format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Months" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 1 Months" Starting on January 31st of Next Year
      event = TestUtil.getUTCEvent(now.clone().add(1,'y').startOf('year').endOf('M').hour(13).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').hour(13).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after cron runs first time');

      // Test Reschedule Cron "Every 1 Months" Starting on last day of Feb of Next Year
      event = TestUtil.getUTCEvent(now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').hour(13).minute(0).utc());
      tscron.runTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after reschedule trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after reschedule');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(now.clone().add(1,'y').startOf('year').add(2, 'M').endOf('M').hour(13).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after cron runs first time');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }

 // Test "Every Months" Where Start Date is in a Long Month (Long Month Has 31 Days) and "Short Months?" = "Yes"
  if (testConfig.everymonths.longyes === true) {
    test('Schedule Cron Job "Every Months" Where Start Date is in Long Month (Has 31 Days) and "Short Months?" Form Response = "Yes"', function() {
      expect(12);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryMonths(form, ['Every Months', '1', 'Yes', now.clone().add(1,'y').startOf('year').date(31).hour(13), now.clone().add(1,'y').endOf('year').hour(13).minute(0)]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Months",
        params:["1", "Yes", now.clone().add(1,'y').startOf('year').date(31).hour(13).format('YYYY-MM-DD kk:mm'), now.clone().add(1,'y').endOf('year').hour(13).minute(0).format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Months" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 1 Months" Starting on January 31st of Next Year
      event = TestUtil.getUTCEvent(now.clone().add(1,'y').startOf('year').endOf('M').hour(13).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').hour(13).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after cron runs first time');

      // Test Reschedule Cron "Every 1 Months" Starting on last day of Feb (28 or 29) of Next Year
      event = TestUtil.getUTCEvent(now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').hour(13).minute(0).utc());
      tscron.runTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after reschedule trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after reschedule');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(now.clone().add(1,'y').startOf('year').add(2, 'M').endOf('M').hour(13).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after reschedule');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }


  // Test "Every Months" Where Start Day in a Short Month (Start Date Month Has < 31 days) and "Short Months?" = "No"
  if (testConfig.everymonths.shortno === true) {
    test('Schedule Cron Job "Every Months" Where Start Day in a Short Month (Start Date Month Has < 31 days) and "Short Months?" Form Response = "No"', function() {
      expect(12);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Start Date and End Date  - Start Date is Feb 28th
      TestUtil.createEveryMonths(form, ['Every Months', '1', 'No', now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').hour(13).minute(0), now.clone().add(1,'y').endOf('year').hour(13).minute(0)]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Months",
        params:["1", "No", now.clone().add(1,'y').startOf('year').add(1,'M').date(28).hour(13).format('YYYY-MM-DD kk:mm'), now.clone().add(1,'y').endOf('year').hour(13).minute(0).format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Months" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 1 Months" Starting on last day of Feb next year
      event = TestUtil.getUTCEvent(now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').hour(13).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').add(1,'M').hour(13).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after cron runs first time');

      // Test Reschedule Cron "Every 1 Months" on Schedule Date in Mar of Next Year (Based on Start Date from Feb)
      event = TestUtil.getUTCEvent(now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').add(1,'M').hour(13).minute(0).utc());
      tscron.runTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after reschedule trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after reschedule');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').add(2, 'M').hour(13).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after reschedule');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }



  // Test "Every Months" Where Start Day in a Short Month (Start Date Month Has < 31 days) and "Short Months?" = "Yes"
  if (testConfig.everymonths.shortyes === true) {
    test('Schedule Cron Job "Every Months" Where Start Day in a Short Month (Start Date Month Has < 31 days) and "Short Months?" Form Response = "Yes"', function() {
      expect(12);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Start Date and End Date  - Start Date is Feb 28th
      TestUtil.createEveryMonths(form, ['Every Months', '1', 'Yes', now.clone().add(1,'y').startOf('year').add(1, 'M').endOf('M').hour(11).minute(0), now.clone().add(1,'y').endOf('year').hour(11).minute(0)]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Months",
        params:["1", "Yes", now.clone().add(1,'y').startOf('year').add(1,'M').endOf('M').hour(11).minute(0).format('YYYY-MM-DD kk:mm'), now.clone().add(1,'y').endOf('year').hour(11).minute(0).format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Months" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 1 Months" Starting on last day of Feb next year
      event = TestUtil.getUTCEvent(now.clone().add(1,'y').startOf('year').add(1,'M').endOf('M').hour(11).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(now.clone().add(1,'y').startOf('year').add(2,'M').endOf('M').hour(11).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after cron runs first time');

      // Test Reschedule Cron "Every 1 Months" on Schedule Date in Mar of Next Year (Based on Start Date from Feb)
      event = TestUtil.getUTCEvent(now.clone().add(1,'y').startOf('year').add(1,'M').endOf('M').add(1,'M').hour(11).minute(0).utc());
      tscron.runTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after reschedule trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after reschedule trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after reschedule');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(now.clone().add(1,'y').startOf('year').add(3, 'M').endOf('M').hour(11).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after reschedule');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }

  // Test "Every Months" Where Next Schedule Month is February in a Leap Year and Scheduled is Last Day of Month
  if (testConfig.everymonths.leapyear === true) {
    test('Schedule Cron Job "Every Months" Where Next Schedule Month is February in a Leap Year and Scheduled is Last Day of Month', function() {
      expect(7);

      var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryMonths(form, ['Every Months', '1', 'No', TestUtil.getLeapYear(now).startOf('year').date(31).hour(13), TestUtil.getLeapYear(now).endOf('year').hour(13).minute(0)]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Months",
        params:["1", "No", TestUtil.getLeapYear(now).startOf('year').date(31).hour(13).format('YYYY-MM-DD kk:mm'), TestUtil.getLeapYear(now).endOf('year').hour(13).minute(0).format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Months" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 1 Months" Starting on January 31st of Next Leap Year
      event = TestUtil.getUTCEvent(TestUtil.getLeapYear(now).startOf('year').endOf('M').hour(13).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(TestUtil.getLeapYear(now).startOf('year').add(1, 'M').endOf('M').hour(13).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after cron runs first time');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }


  // Test "Every Years" Cron Schedule
  if (testConfig.everyyears.standard === true) {
    test('Schedule Cron "Every Years"', function() {
      expect(10);

     var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryYears(form, ['Every Years', '1', 'No', now.clone().add(1,'y').startOf('y').date(31).hour(13).minute(0), now.clone().add(5,'y').endOf('y').hour(13).minute(0)]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Years",
        params:["1", "No", now.clone().add(1,'y').startOf('year').date(31).hour(13).format('YYYY-MM-DD kk:mm'), now.clone().add(5,'y').endOf('year').hour(13).minute(0).format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Years" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 1 Years" Starting on January 31st of Next Year
      event = TestUtil.getUTCEvent(now.clone().add(1,'y').startOf('y').date(31).hour(13).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');

      // Test Schedule Cron "Every 1 Years" Starting on January 31st in 2 Years
      event = TestUtil.getUTCEvent(now.clone().add(2,'y').startOf('y').date(31).hour(13).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }



  // Test "Every Years" Cron Schedule Test Where Start Date is February 29th in a Leap Year and Next Schedule Date is February 28th in non Leap Year
  if (testConfig.everyyears.leapyear === true) {
    test('Schedule Cron "Every Years" Where Start Date is February 29th in a Leap Year and Next Schedule Date is February 28th in non Leap Year', function() {
      expect(7);

     var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryYears(form, ['Every Years', '1', 'Yes', TestUtil.getLeapYear(now).startOf('year').add(1,'M').endOf('M').hour(11).minute(0), TestUtil.getLeapYear(now).add(5,'y').endOf('y').hour(11).minute(0)]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Years",
        params:["1", "Yes", TestUtil.getLeapYear(now).startOf('year').add(1,'M').endOf('M').hour(11).minute(0).format('YYYY-MM-DD kk:mm'), TestUtil.getLeapYear(now).add(5,'y').endOf('year').hour(11).minute(0).format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Years" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 1 Years" Starting on Feb 29th in Leap Year
      event = TestUtil.getUTCEvent(TestUtil.getLeapYear(now).startOf('year').add(1,'M').endOf('M').hour(11).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(TestUtil.getLeapYear(now).add(1,'y').startOf('year').add(1,'M').endOf('M').hour(11).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after cron runs first time');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }

  // Test 'Every Years' Cron Schedule Where Schedule Date is February 28th in a non Leap Year and "Leap Years?" = "Yes"
  if (testConfig.everyyears.leapyes === true) {
    test('Schedule Cron "Every Years" Where Schedule Date is February 28th in a non Leap Year and "Leap Years?" Form Response = "Yes"', function() {
      expect(7);

     var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryYears(form, ['Every Years', '1', 'Yes', TestUtil.getLeapYear(now).add(3,'y').startOf('year').add(1,'M').endOf('M').hour(11).minute(0), TestUtil.getLeapYear(now).add(5,'y').endOf('y').hour(11).minute(0)]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Years",
        params:["1", "Yes", TestUtil.getLeapYear(now).add(3,'y').startOf('year').add(1,'M').endOf('M').hour(11).minute(0).format('YYYY-MM-DD kk:mm'), TestUtil.getLeapYear(now).add(5,'y').endOf('year').hour(11).minute(0).format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Years" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 1 Years" Starting on Feb 28th in non Leap Year with "Leap Years?" = "Yes"
      event = TestUtil.getUTCEvent(TestUtil.getLeapYear(now).add(3,'y').startOf('year').add(1,'M').endOf('M').hour(11).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(TestUtil.getLeapYear(now).add(4,'y').startOf('year').add(1,'M').endOf('M').hour(11).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after cron runs first time');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }


 // Test 'Every Years' Cron Schedule Where Schedule Date is February 28th in a non Leap Year and "Leap Years?" = "No"
  if (testConfig.everyyears.leapno === true) {
    test('Schedule Cron "Every Years" Where Schedule Date is February 28th in a non Leap Year and "Leap Years?" Form Response = "No"', function() {
      expect(7);

     var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(now, form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Start Date and End Date
      TestUtil.createEveryYears(form, ['Every Years', '1', 'No', TestUtil.getLeapYear(now).add(3,'y').startOf('year').add(1,'M').endOf('M').hour(11).minute(0), TestUtil.getLeapYear(now).add(5,'y').endOf('y').hour(11).minute(0)]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Every Years",
        params:["1", "No", TestUtil.getLeapYear(now).add(3,'y').startOf('year').add(1,'M').endOf('M').hour(11).minute(0).format('YYYY-MM-DD kk:mm'), TestUtil.getLeapYear(now).add(5,'y').endOf('year').hour(11).minute(0).format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Every Years" initial configuration with valid start date and end date' );

      // Test Schedule Cron "Every 1 Years" Starting on Feb 28th in non Leap Year with "Leap Years?" = "No"
      event = TestUtil.getUTCEvent(TestUtil.getLeapYear(now).add(3,'y').startOf('y').add(1,'M').endOf('M').hour(11).minute(0).utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 1, '1 "runTSCron" time-based triggers exist after start date trigger');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 1, '1 "endTSCron" time-based triggers exist after form start date trigger');
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      expectedProps.last = moment.utc({y:event.year, M:event.month-1, d:event['day-of-month'], h:event.hour, m:event.minute}).valueOf();
      expectedProps.next = moment.utc(TestUtil.getLeapYear(now).add(4,'y').startOf('y').add(1,'M').date(28).hour(11).minute(0)).valueOf();
      equal(props.last, expectedProps.last, 'tscron "last" script properties correct after cron runs first time');
      equal(moment.utc(props.next).format('MMMM D, YYYY h:mm A'), moment.utc(TestUtil.getLeapYear(now).add(4,'y').startOf('y').add(1,'M').date(28).hour(11).minute(0)).format('MMMM D, YYYY h:mm A'), 'tscron "next" script properties correct after cron runs first time');

      // Cleanup up cron triggers
      tscron.stopCron();

    });
  }


  // Test "Custom" Valid Date Cron Form Submission
  if (testConfig.custom.valid === true) {
    test('Schedule Cron for "Custom" Valid Date', function() {
      expect(5);

     var event = null,
          expectedProps = null,
          d = moment().add(1, 'd'),
          form = FormApp.getActiveForm(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(moment(), form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Valid Custom Date
      TestUtil.createCustom(form, ['Custom', d]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      responses = form.getResponses();
      expectedProps = {
        action: "Custom",
        params:[d.format('YYYY-MM-DD kk:mm')],
        id: responses[responses.length-1].getId(),
        created: moment(responses[responses.length-1].getTimestamp()).utc().valueOf()
      }
      props = JSON.parse(PropertiesService.getScriptProperties().getProperty(testConfig.propsKey));
      deepEqual(props, expectedProps, 'tscron script properties matches for "Custom" initial configuration with valid date' );

      // Test Cron at Schedule Date
      event = TestUtil.getUTCEvent(d.utc());
      tscron.startTSCron(event);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers exist after "Custom" Schedule Date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after "Custom" Schedule Date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after "Custom" Schedule Date');

      // Cleanup up cron triggers
      tscron.stopCron();

    });

  }


    // Test "Custom" Invalid Date Cron Form Submission
  if (testConfig.custom.invalid === true) {
    test('Schedule Cron for "Custom" Invalid Date', function() {
      expect(4);

     var event = null,
          expectedProps = null,
          d = moment(),
          form = FormApp.getActiveForm(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(moment(), form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Script Properties with Invalid Date
      TestUtil.createCustom(form, ['Custom', d]);
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 0, '0 "startTSCron" time-based triggers "Custom" Schedule Date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after "Custom" Schedule Date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after "Custom" Schedule Date');

      // Cleanup up cron triggers
      tscron.stopCron();

    });

  }



  // Test Running the Cron Job Function
  // Assumes form contains one text user defined parameter with title 'Phrase'
  // Assumes cronJob() function contains - return(params.length);
  if (testConfig.runcron === true) {
    test('Test Cron Job Function Call', function() {
      expect(5);

     var event = null,
          expectedProps = null,
          form = FormApp.getActiveForm(),
          now = moment(),
          props = null,
          response = null,
          responses = null,
          tscron = null;

      // Make sure tscron enabled
      tscron = new TSCron(moment(), form);
      tscron.enableCron();
      equal(TestUtil.getTriggers(ScriptApp.EventType.ON_FORM_SUBMIT,testConfig.initialCronJobFunction).length, 1, 'tscron is enabled');

      // Test Valid Start Date with no End Date - Created from Form Submit
      TestUtil.createUserDefined(form, ['Hello World!', 'Every Weeks', '3', now.clone().add(30,'m')]);
      Utilities.sleep(20000);  // To make sure trigger gets setup before testing
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.startCronJobFunction).length, 1, '1 "startTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.additionalCronJobFunction).length, 0, '0 "runTSCron" time-based triggers exist after form submit with valid start date and no end date');
      equal(TestUtil.getTriggers(ScriptApp.EventType.CLOCK, testConfig.endCronJobFunction).length, 0, '0 "endTSCron" time-based triggers exist after form start date trigger');

      event = TestUtil.getUTCEvent(now.clone().add(30,'m').utc());
      tscron.startTSCron(event);
      equal(cronJob(event, tscron.getUserDefinedItemResponses()), 1, 'Correct number of user defined params sent to cronJob(e,params) function');


      // Cleanup up cron triggers
      tscron.stopCron();

    });

  }



}


/*
 * Various TSCron Unit Test Utility Helper Functions
 */
var TestUtil = {
  createCustom: function(form, params) {
    var response = form.createResponse();
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.LIST, 'Run TSCron')).asListItem().createResponse(params[0]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'Custom')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[1])));
    response.submit();
  },
  createEveryDay: function(form, params) {
    var response = form.createResponse();
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.LIST, 'Run TSCron')).asListItem().createResponse(params[0]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.TEXT, 'Every Days')).asTextItem().createResponse(params[1]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'Start On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[2])));
    if (params[3]) {
      response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'End On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[3])));
    }
    response.submit();
  },
  createEveryHour: function(form, params) {
    var response = form.createResponse();
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.LIST, 'Run TSCron')).asListItem().createResponse(params[0]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.TEXT, 'Every Hours')).asTextItem().createResponse(params[1]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'Start On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[2])));
    if (params[3]) {
      response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'End On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[3])));
    }
    response.submit();
  },
  createEveryMinute: function(form, params) {
    var response = form.createResponse();
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.LIST, 'Run TSCron')).asListItem().createResponse(params[0]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.LIST, 'Every Minutes')).asListItem().createResponse(params[1]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'Start On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[2])));
    if (params[3]) {
      response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'End On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[3])));
    }
    response.submit();
  },
  createEveryMonths: function(form, params) {
    var response = form.createResponse();
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.LIST, 'Run TSCron')).asListItem().createResponse(params[0]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.TEXT, 'Every Months')).asTextItem().createResponse(params[1]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.MULTIPLE_CHOICE, 'Short Months?')).asMultipleChoiceItem().createResponse(params[2]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'Start On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[3])));
    if (params[4]) {
      response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'End On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[4])));
    }
    response.submit();
  },
  createEveryWeeks: function(form, params) {
    var response = form.createResponse();
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.LIST, 'Run TSCron')).asListItem().createResponse(params[0]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.TEXT, 'Every Weeks')).asTextItem().createResponse(params[1]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'Start On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[2])));
    if (params[3]) {
      response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'End On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[3])));
    }
    response.submit();
  },
  createEveryYears: function(form, params) {
    var response = form.createResponse();
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.LIST, 'Run TSCron')).asListItem().createResponse(params[0]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.TEXT, 'Every Years')).asTextItem().createResponse(params[1]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.MULTIPLE_CHOICE, 'Leap Years?')).asMultipleChoiceItem().createResponse(params[2]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'Start On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[3])));
    if (params[4]) {
      response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'End On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[4])));
    }
    response.submit();
  },
  createUserDefined: function(form, params) {
    var response = form.createResponse();
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.TEXT, 'Phrase')).asTextItem().createResponse(params[0]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.LIST, 'Run TSCron')).asListItem().createResponse(params[1]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.TEXT, 'Every Weeks')).asTextItem().createResponse(params[2]));
    response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'Start On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[3])));
    if (params[4]) {
      response.withItemResponse(form.getItemById(TestUtil.getItemId(form, FormApp.ItemType.DATETIME, 'End On')).asDateTimeItem().createResponse(TestUtil.getScheduleDate(params[4])));
    }
    response.submit();
  },
  deleteTriggers: function(type, functionName) {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if ((trigger.getEventType() === type && trigger.getHandlerFunction() === functionName )) {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  },
  getItemArrayByName: function(form, name) {
    var itemArray = [];
    form.getItems().forEach(function(item) {
      if (item.getTitle() === name) {
        itemArray.push(item);
      }
    });
    return itemArray;
  },
  getItemId: function(form, type, name) {
    var id = null;
    form.getItems(type).forEach(function(item) {
      if (item.getTitle() === name) {
        id = item.getId();
      }
    })
    return id;
  },
  getLeapYear: function(now) {
    var i = 1,
        year = now.clone();
    if (year.isLeapYear()) {
       return year;
    } else {
      do {
        year = now.clone().add(i,'y');
        i++;
      } while(!year.isLeapYear())
    }
    return year;
  },
  getScheduleDate: function(date) {
     var seconds = 0;
     return new Date(Date.UTC(date.year(), date.month(), date.date(), date.hour(), date.minute(), seconds));
  },
  getTriggers: function(type, functionName) {
    return ScriptApp.getProjectTriggers().filter(function(trigger) {
      if ((trigger.getEventType() === type && trigger.getHandlerFunction() === functionName )) {
        return trigger;
      }
    });
  },
  getUTCEvent: function(utc) {
    return {
      "year": utc.year(),
      "month": utc.month() + 1,
      "day-of-month": utc.date(),
      "day-of-week": utc.day(),
      "hour": utc.hour(),
      "minute": utc.minute(),
      "timezone": 'UTC'

    }
  }
}
