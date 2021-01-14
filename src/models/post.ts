import { Schema, Document } from 'mongoose'
import db from '../db'
import {CommentSchema} from "./comment";
import {Message} from "./message";

export type Post = Message & {
  groupId: string
}

const PostSchema = new Schema<Post>({
  id: { type: String },
  groupId: { type: String },
  text: { type: String },
  mediaUrls: [{ type: String }],
  comments: [CommentSchema]
})

export default db.model<Post & Document>('posts', PostSchema)
