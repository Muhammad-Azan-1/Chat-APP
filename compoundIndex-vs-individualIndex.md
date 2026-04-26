## Think of it Like a Book

### Individual Index = Multiple Books, Each Sorted Differently

Imagine you have a **contacts book** and you make 3 copies:
- Copy 1 → sorted by **phone number**
- Copy 2 → sorted by **name**
- Copy 3 → sorted by **email**

```
"Find person with phone 0300-1234"  → open Copy 1, jump straight to it ✅
"Find person named Ali"             → open Copy 2, jump straight to it ✅
"Find person with email a@mail.com" → open Copy 3, jump straight to it ✅
```

Each book is **only useful for one type of search.**

---

### Compound Index = One Book Sorted by Two Things Together

Now imagine **one book** sorted by **city first, then name inside each city:**

```
Karachi → Ali
Karachi → Hamza
Karachi → Sara
Lahore  → Bilal
Lahore  → Zara
```

```
"Find Ali in Karachi"   → jump straight to Karachi section, find Ali ✅
"Find anyone in Karachi → jump straight to Karachi section ✅
"Find Ali in any city"  → ❌ useless, book isn't sorted by name first
```

---

### The Single Rule You Need

> **Compound index = only useful if your query starts from the FIRST field**

```js
userSchema.index({ city: 1, name: 1 })

✅  find({ city: "Karachi" })
✅  find({ city: "Karachi", name: "Ali" })
❌  find({ name: "Ali" })               // name is not first
```

---

### Real Decision — Just Ask Yourself This

```
"Do I ALWAYS search these fields TOGETHER?"
        │
        ├── YES → Compound Index
        │         userSchema.index({ city: 1, country: 1 })
        │
        └── NO  → Individual Indexes
                  userSchema.index({ city: 1 })
                  userSchema.index({ country: 1 })
```

---

### Your Auth App — Konkret Example

```js
// email alone → to login
// username alone → to check availability  
// OTP alone → to verify email
// These are NEVER searched together → Individual indexes

userSchema.index({ email: 1 },           { unique: true })
userSchema.index({ username: 1 },        { unique: true })
userSchema.index({ verificationOTP: 1 }, { sparse: true })

// ─────────────────────────────────────────
// Compound would make sense IF you had:
User.find({ country: "PK", city: "Karachi" }) // always together
//                    ↑
// then: userSchema.index({ country: 1, city: 1 })
```

---

> **One line summary:**
> Individual = each field is searched alone. Compound = multiple fields always searched together, and the **order matters** — query must start from the leftmost field.