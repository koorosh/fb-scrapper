export interface Message {
  id: string
  author: string
  text: string
  mediaUrls: string[]
  comments: Message[]
}
