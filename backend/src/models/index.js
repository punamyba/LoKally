import User from "./user.model.js";
import Place from "./place.model.js";
import ContactMessage from "./contactMessage.model.js";
import ContactReply from "./contactReply.model.js";

// Place associations
Place.belongsTo(User, { foreignKey: "submitted_by", as: "submitter" });
User.hasMany(Place, { foreignKey: "submitted_by", as: "places" });
Place.belongsTo(User, { foreignKey: "approved_by", as: "approver" });

// Contact associations
ContactMessage.hasMany(ContactReply, {
  foreignKey: "contact_message_id",
  as: "replies",
  onDelete: "CASCADE",
});

ContactReply.belongsTo(ContactMessage, {
  foreignKey: "contact_message_id",
  as: "ticket",
});

export { User, Place, ContactMessage, ContactReply };