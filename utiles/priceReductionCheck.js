const PropertyModel = require("../models/PropertyModel");
const User = require("../models/UserModel");
const UserSavedPropertyModel = require("../models/UserSavedPropertiesModel");
const Handlebars = require("handlebars");
const transporter = require("./emailTransportar.js");
const fs = require("fs");
const path = require('path');
// ---- Registering a helper function to increament the index of each link----
Handlebars.registerHelper("increment", function (index) {
  return index + 1;
});
// Setting the email template
const source = fs
  .readFileSync(path.resolve(__dirname, "../email-templates/template4.html"), "utf-8")
  .toString();
const template = Handlebars.compile(source);


const priceReductionCheck = async () => {
  const users = await User.find();
  if (users.length < 1) {
    return;
  }
  await Promise.all(
    users.map(async (user) => {
      // Checking if this is the time to send emails
      if (!user.alert_type || user.alert_type === "never") return;

      //Checking Monthly users
      if (user.alert_type === "monthly" && user.alert_send_date) {
        const lastEmailDate = new Date(user.alert_send_date);
        const oneMonthLater = new Date(
          lastEmailDate.setMonth(lastEmailDate.getMonth() + 1)
        );
        const currentDate = new Date();
        // Sending the email if one month has been passed or not
        if (currentDate >= oneMonthLater) {
          console.log("Sending the email");
          CheckPriceChangeAndSendEmail(user);
          return;
        }
      }
      //Checking Weekly users
      if (user.alert_type === "weekly" && user.alert_send_date) {
        const lastEmailDate = new Date(user.alert_send_date);
        const oneWeekLater = new Date(
          lastEmailDate.setMonth(lastEmailDate.getDate() + 7)
        );
        const currentDate = new Date();
        // Sending the email if one week has been passed or not
        if (currentDate >= oneWeekLater) {
          console.log("Sending the email");
          CheckPriceChangeAndSendEmail(user);
          return;
        }
      }
      // Sending email for Immediately and those users  who does not have any alert_send_date but do have alert_type
      CheckPriceChangeAndSendEmail(user);
    })
  );
};

const CheckPriceChangeAndSendEmail = async (user) => {
  // Retrieve all saved properties for the user in one query
  const savedSearchProperties = await UserSavedPropertyModel.find({
    USER_EMAIL: user.email,
  });

  if (savedSearchProperties.length === 0) return;

  const priceReducedPropertiesLinks = [];

  // Process each saved property for price comparison
  await Promise.all(
    savedSearchProperties.map(async (property) => {
      const rawProperty = await PropertyModel.findOne({
        AGENT_REF: property.AGENT_REF,
      });

      if (!rawProperty) return; // Skip if property not found

      const oldPrice = parseInt(property.PRICE);
      const newPrice = parseInt(rawProperty.PRICE);

      // Add to links if the price has dropped
      if (newPrice < oldPrice) {
        priceReducedPropertiesLinks.push({
          url: `${process.env.CLIENT_URL}/hauses/${rawProperty._id}`,
        });
      }
    })
  );

  // Saving the date time to alert_send_date
  user.alert_send_date = Date.now();
  await user.save();

  // Only send email if there are price-reduced properties
  if (priceReducedPropertiesLinks.length > 0) {
    const replacements = { links: priceReducedPropertiesLinks };
    const htmlToSend = template(replacements);
    console.log("Mahidun..Email is being send");
    // await transporter.sendMail({
    //   from: '"Haus" <haus@property.email>',
    //   to: "mdmahidunnobi@gmail.com", // use user's email directly
    //   subject: "Price Drop!",
    //   html: htmlToSend,
    // });
  }
};

module.exports = priceReductionCheck;
