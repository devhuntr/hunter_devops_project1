/* Vue 1 + vue-resource, matching the original bulletin board stack. */
new Vue({
  el: '#tracker',
  data: {
    newTitle: '', tasks: [], filter: 'all', busy: false, error: '',
    filters: [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'completed', label: 'Done' }]
  },
  ready: function () { this.loadTasks(); },
  computed: {
    completedCount: function () { return this.tasks.filter(function (t) { return t.completed; }).length; },
    remaining: function () { return this.tasks.length - this.completedCount; },
    percent: function () { return this.tasks.length ? Math.round(this.completedCount / this.tasks.length * 100) : 0; },
    visibleTasks: function () {
      var filter = this.filter;
      return this.tasks.filter(function (t) { return filter === 'all' || (filter === 'active' ? !t.completed : t.completed); });
    },
    emptyTitle: function () { return this.filter === 'completed' ? 'Nothing finished yet' : this.filter === 'active' ? 'All caught up!' : 'A fresh start.'; },
    emptyMessage: function () { return this.filter === 'completed' ? 'Completed tasks will show up here.' : this.filter === 'active' ? 'You have no active tasks. Enjoy the moment.' : 'Add your first task above to get started.'; }
  },
  methods: {
    fail: function (response) { this.error = response && response.data && response.data.error || 'Something went wrong. Please try again.'; },
    loadTasks: function () {
      var vm = this;
      this.$http.get('/api/tasks').then(function (res) { vm.tasks = res.data; }, function (res) { vm.fail(res); });
    },
    addTask: function () {
      var vm = this, title = this.newTitle.trim();
      if (!title || this.busy) return;
      this.busy = true; this.error = '';
      this.$http.post('/api/tasks', { title: title }).then(function (res) {
        vm.tasks.unshift(res.data); vm.newTitle = ''; vm.filter = 'all'; vm.busy = false;
      }, function (res) { vm.fail(res); vm.busy = false; });
    },
    toggleTask: function (task) {
      var vm = this, next = !task.completed;
      if (this.busy) return;
      this.busy = true; this.error = '';
      this.$http.patch('/api/tasks/' + encodeURIComponent(task.id), { completed: next }).then(function (res) {
        task.completed = res.data.completed; vm.busy = false;
      }, function (res) { vm.fail(res); vm.busy = false; });
    },
    deleteTask: function (task) {
      var vm = this;
      if (this.busy) return;
      this.busy = true; this.error = '';
      this.$http.delete('/api/tasks/' + encodeURIComponent(task.id)).then(function () {
        vm.tasks = vm.tasks.filter(function (t) { return t.id !== task.id; }); vm.busy = false;
      }, function (res) { vm.fail(res); vm.busy = false; });
    }
  }
});
