// Load jQuery from NPM
import $ from 'jquery';

import { DateTime } from 'luxon';

window.jQuery = $;
window.$ = $;

let parsed;
let timeZones;

const timeFormat = 'yyyy-MM-dd T';
const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

let selectedTZ;

function toFormat(dateTime) {
  return dateTime.toFormat(timeFormat).replace(' ', 'T');
}

function dateChange() {
  const timeDate = $('#originalTime').val();
  const timeZone = selectedTZ;

  parsed = DateTime.fromFormat(timeDate.replace('T', ' '), timeFormat, {
    zone: timeZone,
  });

  const iso = toFormat(parsed);
  window.location.hash = `${iso} ${timeZone}`;

  const localTime = parsed.setZone(localTimeZone);
  const yourTimeText = `${localTime.toLocaleString(DateTime.DATETIME_MED)} ${localTimeZone}`;
  $('#yourTime').text(yourTimeText);
}

function parseHash() {
  if (!window.location.hash) {
    throw Error('No Hash');
  }
  const inputTime = window.location.hash
    .substring(1)
    .replaceAll('%20', ' ')
    .split(' ');
  const localParsed = DateTime.fromFormat(inputTime[0].replace('T', ' '), timeFormat, {
    zone: inputTime[1] || 'UTC',
  });
  if (localParsed.invalid) {
    throw localParsed.invalidReason;
  }
  selectedTZ = localParsed.zone.name;
  return localParsed;
}

function loadSelectedTimeZone(timeZone) {
  const selectedZonesOptions = timeZones
    .find((elem) => elem.group === timeZone)
    .zones.map((myZone) => (
      new Option(myZone.name,
        myZone.value,
        false,
        myZone.value === selectedTZ)));
  $('#zone').empty();
  $('#zone').append(selectedZonesOptions);
  selectedTZ = $('#zone option:selected').val();
  dateChange();
}

function parseTimeZones() {
  const selectGroupItems = timeZones.map(
    (timeZone) => (
      new Option(
        timeZone.group,
        timeZone.group,
        false,
        timeZone.zones.filter((elem) => elem.value === selectedTZ).length > 0,
      )
    ),
  );
  $('#group').append(selectGroupItems);
  loadSelectedTimeZone($('#group option:selected').val());
}

function loadTimeZones() {
  fetch('./timezones.json')
    .then((response) => response.json())
    .then((data) => {
      timeZones = data;
      parseTimeZones();
    });
}

function init() {
  selectedTZ = localTimeZone;
  parseTimeZones();
  $('.time').removeClass('is-disabled');
  $('#originalTime').removeAttr('disabled');
  $('#group').removeAttr('disabled');
  $('#zone').removeAttr('disabled');
}

$(() => {
  try {
    $('#originalTime').val(toFormat(DateTime.local()));
    parsed = parseHash();
    $('#originalTime').val(toFormat(parsed));

    $('#originalTime').attr('disabled', 'disabled');
    $('#group').attr('disabled', 'disabled');
    $('#zone').attr('disabled', 'disabled');
  } catch (err) {
    selectedTZ = localTimeZone;
  } finally {
    loadTimeZones();
  }
  $('#originalTime').on('change', dateChange);
  $('#timezone').on('change', dateChange);
  $('#group').on('change', function a() {
    loadSelectedTimeZone(this.value);
  });
  $('#zone').on('change', function b() {
    selectedTZ = this.value;
    dateChange();
  });
  $('#newDate').on('click', init);
});
