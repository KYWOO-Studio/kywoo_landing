const C = require('../../data/content.js');

Component({
  data: { notes: C.notes },
  methods: {
    onShareAppMessage() {
      return { title: `${C.notes.title} · KYWOO Studio`, path: '/pages/notes/notes' };
    },
  },
});
