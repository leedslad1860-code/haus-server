const getFilterObj = (query) => {
  //console.log(query)
  const filter = {};
  if(query.showLetAgreed != 'true')
    filter.STATUS_ID = { $nin: [5] }; // default filter
  if (query.agent_ref) {
    filter.AGENT_REF = new RegExp(query.agent_ref, "i");
  }
  if (query.is_student_property !== undefined) {
    filter.is_student_property = query.is_student_property === "true";
  }
      /*
  if (query.badrooms) {
    const bedroomsArray = query.badrooms.split(",").map(Number); // Convert the "4,5,7,8" string into an array of numbers
    filter.BEDROOMS = { $in: bedroomsArray };
  }
    */
  if (query.badrooms) {
    const bedroomsArray = query.badrooms.split(",").map(Number);
    if (bedroomsArray.includes(10)) {
      const filteredArray = bedroomsArray.filter(num => num !== 10);
      
      if (filteredArray.length > 0) {
        filter.$or = [
          { BEDROOMS: { $in: filteredArray.map(num => num.toString()) } },
          { 
            $and: [
              { BEDROOMS: { $regex: "^\\d+$" } },  
              { $expr: { $gte: [{ $toInt: "$BEDROOMS" }, 10] } }
            ]
          }
        ];
      } else {
        filter.$and = [
          { BEDROOMS: { $regex: "^\\d+$" } }, 
          { $expr: { $gte: [{ $toInt: "$BEDROOMS" }, 10] } }
        ];
      }
    } else {
      filter.BEDROOMS = { $in: bedroomsArray.map(num => num.toString()) };
    }
  }
  if (query.max_price || query.min_price) {
    // Room Only: the price range is per person (the room price), not the whole-property PCM figure
    const priceExpr = query.prop_sub_id === "48" ? "$rooms_from" : { $toDouble: "$PRICE" };
    filter.$expr = {
      $and: [
        { $gte: [priceExpr, Number(query.min_price)] },
        {
          $lte: [
            priceExpr,
            query.max_price === "0" ? 200 : Number(query.max_price),
          ],
        },
      ],
    };
  }
  if (query.prop_sub_id && query.prop_sub_id !== "") {
    if (query.prop_sub_id === "48") {
      filter.has_rooms = true; // Room Only = properties with rooms still to let
      delete filter.STATUS_ID; // rooms are what's on offer, so a let-agreed house with free rooms still shows
    } else {
      filter.PROP_SUB_ID = query.prop_sub_id;
    }
  }
  if (query.location && query.location !== "") {
    filter.$or = [
      { ADDRESS_2: new RegExp(query.location, "i") },
      { ADDRESS_3: new RegExp(query.location, "i") },
    ];
  }

  if (query.PROPERTY_WEEK && query.PROPERTY_WEEK === 1) {
    filter.PROPERTY_WEEK = query.PROPERTY_WEEK;
  }

  if (query.LET_TYPE_ID && query.LET_TYPE_ID === 0) {
    filter.LET_TYPE_ID = { $ne: 1 }; // Exclude LET_TYPE_ID = 1
  }

  return filter;
};

module.exports = getFilterObj;
