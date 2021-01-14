import { Schema, Document } from 'mongoose'
import db from '../db'
import {Message} from "./message";

export type Comment = Message

export const CommentSchema = new Schema<Comment>({
  id: { type: String },
  author: { type: String },
  text: { type: String },
  mediaUrls: [{ type: String }],
})

CommentSchema.add({
  comments: [CommentSchema],
})

export default db.model<Document & Comment>('comments', CommentSchema)
