const { Schema, model, Types } = require("mongoose");

const auditLogSchema = new Schema(
  {
    team: { type: Types.ObjectId, ref: "Team", required: true },
    actor: { type: Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, required: true, trim: true },
    targetId: { type: Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = model("AuditLog", auditLogSchema);
