sparse: true is a very important property when you have a field that is unique but optional.

Here is why we use it in your googleId:

The Problem without sparse
Normally, if you set unique: true on googleId, MongoDB creates an index. If a user registers with Email/Password instead of Google, the googleId field will be null.

The problem is that MongoDB treats null as a value. So:

User A registers with Email (googleId is null).
User B registers with Email (googleId is null).
CRASH! MongoDB throws a "Duplicate Key Error" because it sees two null values and your index says they must be unique.

The Solution: sparse: true
When you add sparse: true, you are telling MongoDB:

"Only put this document in the index if the field actually exists. If it's missing or null, just ignore it and don't check for uniqueness."


