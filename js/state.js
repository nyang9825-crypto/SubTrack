let currentUid = null; // set after Firebase auth; keys all localStorage data
let subs = [];
let editingId = null;
let selectedEmoji = '📦';
let filterCategory = 'All';

let gmailToken = null;
let detectedSubs = [];
let detectedSource = 'gmail';
