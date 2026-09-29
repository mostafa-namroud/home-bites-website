/* ============================================================================
   HOME BITES — MENU DATA
   Mirrors menuwave.online/menu.php?slug=home-bites (16 dishes, 2 categories).
   To change a price or add a dish, edit this list only; the menu, cart and
   WhatsApp message are all built from it.
     img:  base name in assets/menu/ (…-480.webp / …-800.webp), or null for the
           kraft "seal" card
     cut:  true when the photo is a transparent cut-out (platter on no background)
   ========================================================================== */
window.HB_MENU = [
  /* ---------- مندي ---------- */
  { id: 'mandi-chicken-1',   cat: 'mandi',  name: 'مندي دجاج',          serves: 'لشخص واحد',    price: 7,   best: true,  img: 'mandi-chicken-1' },
  { id: 'mandi-chicken-2',   cat: 'mandi',  name: 'مندي دجاج',          serves: 'لشخصين',        price: 12,  img: 'mandi-chicken-2' },
  { id: 'mandi-chicken-5',   cat: 'mandi',  name: 'مندي دجاج',          serves: 'لخمسة أشخاص',   price: 35,  img: 'mandi-chicken-5' },
  { id: 'mandi-lamb-1',      cat: 'mandi',  name: 'مندي لحم غنم',       serves: 'لشخص واحد',    price: 12,  best: true,  img: 'mandi-lamb-1' },
  { id: 'mandi-lamb-2',      cat: 'mandi',  name: 'مندي لحم غنم',       serves: 'لشخصين',        price: 24,  img: 'mandi-lamb-2' },
  { id: 'mandi-lamb-6',      cat: 'mandi',  name: 'مندي لحم غنم',       serves: 'لستة أشخاص',    price: 56,  img: 'mandi-lamb-6', cut: true },

  /* ---------- منسف ---------- */
  { id: 'mansaf-jo-1',       cat: 'mansaf', name: 'منسف أردني',         serves: 'لشخص واحد',    price: 13,  best: true,  note: 'يُقدَّم مع ربع كيلو جميد أردني',        img: 'mansaf-jo-1' },
  { id: 'mansaf-jo-2',       cat: 'mansaf', name: 'منسف أردني إكسترا',  serves: 'لشخصين',        price: 24,  note: 'يُقدَّم مع نص كيلو جميد أردني',          img: 'mansaf-jo-2' },
  { id: 'mansaf-jo-3',       cat: 'mansaf', name: 'منسف أردني',         serves: 'لثلاثة أشخاص',  price: 39,  note: 'يُقدَّم مع ثلاث أرباع كيلو جميد أردني',  img: 'mansaf-jo-3' },
  { id: 'mansaf-jo-6',       cat: 'mansaf', name: 'منسف أردني',         serves: 'لستة أشخاص',    price: 75,  note: 'يُقدَّم مع كيلو جميد أردني',             img: 'mansaf-jo-6' },
  { id: 'mansaf-jo-10',      cat: 'mansaf', name: 'منسف أردني',         serves: 'لعشرة أشخاص',   price: 130, note: 'يُقدَّم مع كيلو ونص جميد أردني',         img: 'mansaf-jo-10' },
  { id: 'mansaf-chicken-5',  cat: 'mansaf', name: 'منسف رز دجاج',       serves: 'لخمسة أشخاص',   price: 30,  img: 'mansaf-chicken-5', cut: true },
  { id: 'mansaf-beef-5',     cat: 'mansaf', name: 'منسف رز لحم بقر',    serves: 'لخمسة أشخاص',   price: 40,  img: null },
  { id: 'mansaf-lamb-5',     cat: 'mansaf', name: 'منسف رز لحم غنم',    serves: 'لخمسة أشخاص',   price: 44,  img: null },
  { id: 'mansaf-lbchicken-5',cat: 'mansaf', name: 'منسف دجاج لبناني',   serves: 'لخمسة أشخاص',   price: 45,  note: 'مع لحم مفروم', img: null },
  { id: 'mansaf-lblamb-5',   cat: 'mansaf', name: 'منسف لحم غنم لبناني', serves: 'لخمسة أشخاص',  price: 55,  note: 'مع لحم مفروم', img: null }
];

window.HB_CONFIG = {
  whatsapp: '96171964330',   /* international format, no + or spaces */
  deliveryFee: 1.11          /* flat delivery, same as the menuwave cart */
};
