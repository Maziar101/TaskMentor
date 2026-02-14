import { Schema, model, Types } from "mongoose";

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

const AuditLog = model("AuditLog", auditLogSchema);

export default AuditLog;
