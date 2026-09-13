const retriveDataFromFile = require("./retriveData.js");

// Parse the rooms BLM (151_151_02_*.BLM) and attach the rooms still to let to
// each property by AGENT_REF. The rooms file only contains rooms for properties
// whose Letting Adverts include Room Lets / Room Lets with agent bills.
const attachRooms = async (properties, roomsFilePath) => {
  let roomsData = [];
  try {
    roomsData = await retriveDataFromFile(roomsFilePath);
  } catch (e) {
    console.error("attachRooms: could not read rooms file", roomsFilePath, e);
    roomsData = [];
  }
  if (!Array.isArray(roomsData)) roomsData = [];

  const byRef = {};
  for (const r of roomsData) {
    const ref = r.AGENT_REF;
    if (!ref) continue;
    (byRef[ref] = byRef[ref] || []).push({
      ROOM_NUMBER: r.ROOM_NUMBER || "",
      ROOM_NAME: r.ROOM_NAME || "",
      ROOM_DESC: r.ROOM_DESC || "",
      ROOM_SUBHEAD: r.ROOM_SUBHEAD || "",
      PRICE: r.PRICE || "",
      LET_BOND: r.LET_BOND || "",
      LET_DATE_AVAILABLE: r.LET_DATE_AVAILABLE || "",
      LET_RENT_FREQUENCY: r.LET_RENT_FREQUENCY || "",
      MEDIA_IMAGE_00: r.MEDIA_IMAGE_00 || "",
      TLS_ENSUITE: r.TLS_ENSUITE || "",
      TLS_ENSUITE_IMAGE: r.TLS_ENSUITE_IMAGE || "",
    });
  }

  return properties.map((p) => {
    const rooms = byRef[p.AGENT_REF] || [];
    rooms.sort((a, b) => (parseInt(a.ROOM_NUMBER) || 0) - (parseInt(b.ROOM_NUMBER) || 0));
    const prices = rooms
      .map((r) => parseFloat(r.PRICE))
      .filter((n) => !isNaN(n) && n > 0);
    return {
      ...p,
      rooms,
      has_rooms: rooms.length > 0,
      rooms_from: prices.length ? Math.min(...prices) : null,
    };
  });
};

module.exports = attachRooms;
