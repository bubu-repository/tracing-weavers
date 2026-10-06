/**
 * Every word a visitor reads, in one place.
 *
 * Written against the Ogilvy principles (skill: ogilvy-copywriting), in ENGLISH:
 * the interface speaks English and the craft keeps its own words as a gloss
 * (tenun, ikat, mengkudu). Proper nouns stay as they are — a weaver's name is
 * not translated.
 *
 * The rules the copy is held to:
 *  · one promise per surface, in plain words: "this cloth has a name"
 *  · the framing said out loud: a birth record for the cloth
 *  · facts instead of praise: eleven weeks, three dye baths, three districts
 *  · short sentences, one idea each
 *  · nothing explains the machinery to a visitor before it earns it
 */

export const t = {
    /* shell */
    readTag: "Tap a tag",
    readTagEn: "Read a tag",
    myPassports: "My traces",
    openPassport: "My traces",
    signIn: "Sign in",
    brandLine: "Trace every thread",

    /* home — the promise, then the news, then the action */
    homeEyebrow: "Tracing Weavers · Indonesia Heritage for Human Flourishing",
    homeTitleA: "Every thread",
    homeTitleB: "has a story",
    homeLead:
        "From seed to loom, from Adonara to the world. Hold your phone to the tag on any cloth, and trace every hand that shaped it.",
    exploreCloths: "Explore the cloths",
    howItWorks: "How it works",
    joinLead:
        "Claim a cloth's certificate and keep it under your name — one page per weave, bound as a book.",
    joinButton: "Create an account",
    recordsEyebrow: "Cloth records",
    recordsTitle: "Trace the weave.",
    recordsLead:
        "Every cloth in the exhibition has a page. Search by its name, where it was woven, or the code on its label.",
    recordsCount: "records",
    tagsCount: "tags",

    /* what it is / is not — the trust block, one line each */
    beforeEyebrow: "What this is",
    beforeTitle: "A trace, not a token.",
    explain: [
        {
            title: "What you claim",
            body: "One cloth, one page: trace every hand, every material, every week on the loom.",
        },
        {
            title: "Why it exists",
            body: "In Adonara, a weaver's name is rarely written down. Tracing Weavers changes that.",
        },
        {
            title: "What you get",
            body: "A record anyone can verify, and a thread you can follow.",
        },
    ],

        /* The seven stages of the programme. `id_label` is what is shown, and `id` is
       the key that a record's "Journey step" attribute matches on (see
       components/journey-strip.tsx). */
    journeyEyebrow: "The path of a weave",
    journeyTitle: "Seven stages of a weave.",
    journeyLead:
        "Three years, seven stages, across Adonara, Lembata and Manggarai. Each stage carries the one before it forward.",
    steps: [
                { id: "Seed", id_label: "Seed", note: "Cotton planted in community gardens" },
        { id: "Loom", id_label: "Loom", note: "Woven, one length by one weaver" },
        { id: "Trace", id_label: "Trace", note: "The tag is written, the record sticks" },
        { id: "Teach", id_label: "Teach", note: "Motifs documented for the curriculum" },
        { id: "Regenerate", id_label: "Regenerate", note: "Gardens and tools restored" },
        { id: "Hub", id_label: "Hub", note: "Sold through the Local Impact Hub" },
        { id: "Flourish", id_label: "Flourish", note: "Value returns to the weaver's household" },
    ],

    /* the natural dyes — the brand's reserved data palette */
    dyeEyebrow: "Natural dyes",
    dyeLead: "Four colours from the weavers' dye pots — indigo leaf, morinda root, turmeric, clay.",

    /* record page */
    backToRecords: "All records",
    recordEyebrow: "Cloth record",
    supplyUnique: "One of one",
    supplyShared: "up to {n} holders",
    issued: "Issued",
    remaining: "Still available",
    fieldOrigin: "Origin",
    fieldMaterial: "Material",
    fieldTechnique: "Technique",
    fieldDye: "Dye",
    fieldWeeks: "Weeks on the loom",
    fieldBaths: "Dye baths",
    fieldStep: "Journey stage",
    traitsEyebrow: "Cloth notes",
    yourPassport: "Your certificate",

    /* claim */
    claimEyebrow: "Claim this certificate",
    claimTitle: "Put your name on this certificate.",
    claimLead:
        "Sign in first: a certificate is kept under your name and email, so it needs an account.",
    claimName: "Full name",
    claimEmail: "Email",
    claimOutlet: "Organisation · optional",
    claimButton: "Claim this certificate",
    claimBusy: "Issuing the certificate…",
    claimSoldOut: "All certificates issued",
    claimOnePerCloth: "One certificate per cloth",
    claimFine:
        "The certificate is yours; the cloth and its motifs stay with the weaver and their community.",
    claimedEyebrow: "Issued",
    claimedHolder: "Held by",
    claimedWovenBy: "Woven by",
    claimedIssued: "Issued on",
    claimedNote:
        "The record travels with the cloth, including when it changes hands. Every resale returns value to the household that wove it.",
    viewPassport: "View the certificate",
    stayHere: "Stay on this record",

    /* collection / verify / login */
    collectionEyebrow: "Traces",
    collectionTitle: "Your certificates",
    collectionEmpty: "No certificates yet",
    collectionEmptyNote:
        "Trace a cloth and its record waits here. Claimed on another device? Open the verification link and save it.",
    collectionSignInNote:
        "Sign in with the email you claimed with, so your name is filled in next time.",
    signInEyebrow: "Sign in",
    signInTitle: "Sign in, or make an account.",
    signInLead: "A name and an email. No wallet, no crypto.",
    signInButton: "Sign in",
    verifyEyebrow: "Certificate check",
    verifyStored: "Verified against the register",
    verifySignature: "Verified by signature",
    verifyProves: "What this page proves",

    /* scan */
    scanEyebrow: "How it works",
    scanTitleA: "One cloth,",
    scanTitleB: "one page.",
    scanLead: "cloths registered across six collections.",
} as const;