const BASE_TITLE = 'Tramp Freighter Blues';

const VIEW_MODE_TITLES = {
  ORBIT: 'Starmap',
  STATION: 'Station',
  ENCOUNTER: 'Encounter',
  PAVONIS_RUN: 'Pavonis Run',
  EPILOGUE: 'Epilogue',
};

export function getPageTitle(viewMode) {
  const prefix = VIEW_MODE_TITLES[viewMode];
  return prefix ? `${prefix} - ${BASE_TITLE}` : BASE_TITLE;
}
