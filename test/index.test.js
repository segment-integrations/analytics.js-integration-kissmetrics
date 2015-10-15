
var Analytics = require('analytics.js-core').constructor;
var integration = require('analytics.js-integration');
var sandbox = require('clear-env');
var tester = require('analytics.js-integration-tester');
var KISSmetrics = require('../lib/');

describe('KISSmetrics', function() {
  var analytics;
  var kissmetrics;
  var options = {
    apiKey: '67f57ae9d61a6981fa07d141bec8c6c37e8b88c7'
  };

  before(function() {
    // setup global that tell kissmetrics to not fire jsonp breaking requests
    window.KM_DNT = true;
    window.KMDNTH = true;
  });

  beforeEach(function() {
    analytics = new Analytics();
    kissmetrics = new KISSmetrics(options);
    analytics.use(KISSmetrics);
    analytics.use(tester);
    analytics.add(kissmetrics);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    kissmetrics.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(KISSmetrics, integration('KISSmetrics')
      .assumesPageview()
      .global('KM')
      .global('_kmil')
      .global('_kmq')
      .option('apiKey', '')
      .option('prefixProperties', true)
      .option('trackCategorizedPages', true)
      .option('trackNamedPages', true));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(kissmetrics, 'load');
      analytics.initialize();
      analytics.page();
    });

    describe('#initialize', function() {
      it('should create window._kmq', function() {
        analytics.assert(window._kmq instanceof Array);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(kissmetrics, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should create window.KM', function() {
      analytics.assert(window.KM);
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
        analytics.stub(window.KM, 'pageView');
      });

      afterEach(function() {
        // set back to defaults
        window.KM_SKIP_PAGE_VIEW = 1;
      });

      it('should record normal kissmetrics page views when the option is set', function() {
        window.KM_SKIP_PAGE_VIEW = false;
        analytics.page();
        analytics.didNotCall(window._kmq.push);
      });

      it('should call `KM.pageView()` when KM_SKIP_PAGE_VIEW is not set', function() {
        window.KM_SKIP_PAGE_VIEW = false;
        analytics.page();
        analytics.calledOnce(window.KM.pageView);
      });

      it('should not call `KM.pageView()` when KM_SKIP_PAGE_VIEW is set', function() {
        window.KM_SKIP_PAGE_VIEW = 1;
        analytics.page();
        analytics.didNotCall(window.KM.pageView);
      });

      it('should track named pages by default', function() {
        analytics.page('Name', {
          title: document.title,
          url: window.location.href
        });
        analytics.called(window._kmq.push, ['record', 'Viewed Name Page', {
          'Page - title': document.title,
          'Page - url': window.location.href,
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - search': window.location.search,
          'Page - name': 'Name'
        }]);
      });

      it('should not track a named page when the option is off, but should track category', function() {
        kissmetrics.options.trackNamedPages = false;
        analytics.page('Category', 'Name');
        analytics.calledOnce(window._kmq.push);
        analytics.called(window._kmq.push, ['record', 'Viewed Category Page', {
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - title': document.title,
          'Page - search': window.location.search,
          'Page - name': 'Name',
          'Page - category': 'Category',
          'Page - url': window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search
        }]);
      });

      it('should not track a categorized page when the option is off, but should track name', function() {
        kissmetrics.options.trackCategorizedPages = false;
        analytics.page('Category', 'Name');
        analytics.calledOnce(window._kmq.push);
        analytics.called(window._kmq.push, ['record', 'Viewed Name Page', {
          'Page - title': document.title,
          'Page - url': window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search,
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - search': window.location.search,
          'Page - name': 'Name',
          'Page - category': 'Category'
        }]);
      });

      it('should track only named page when both options are on', function() {
        analytics.page('Category', 'Name');
        analytics.calledOnce(window._kmq.push);
        analytics.called(window._kmq.push, ['record', 'Viewed Name Page', {
          'Page - title': document.title,
          'Page - url': window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search,
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - search': window.location.search,
          'Page - name': 'Name',
          'Page - category': 'Category'
        }]);
      });

      it('should prefixProperties even if option is off', function() {
        kissmetrics.options.prefixProperties = false;
        analytics.page('Name', {
          title: document.title,
          url: window.location.href
        });
        analytics.called(window._kmq.push, ['record', 'Viewed Name Page', {
          'Page - title': document.title,
          'Page - url': window.location.href,
          'Page - name': 'Name',
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - search': window.location.search
        }]);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window._kmq.push, ['identify', 'id']);
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window._kmq.push, ['set', { trait: true }]);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window._kmq.push, ['identify', 'id']);
        analytics.called(window._kmq.push, ['set', { trait: true, id: 'id' }]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._kmq.push, ['record', 'event', {}]);
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window._kmq.push, ['record', 'event', {
          'event - property': true
        }]);
      });

      it('should alias revenue to "Billing Amount"', function() {
        analytics.track('event', { revenue: 9.99 });
        analytics.called(window._kmq.push, ['record', 'event', {
          'Billing Amount': 9.99
        }]);
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
      });

      it('should send a new id', function() {
        analytics.alias('new');
        analytics.called(window._kmq.push, ['alias', 'new', undefined]);
      });

      it('should send a new and old id', function() {
        analytics.alias('new', 'old');
        analytics.called(window._kmq.push, ['alias', 'new', 'old']);
      });
    });

    describe('ecommerce', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
        analytics.stub(window.KM, 'set');
      });

      it('should track viewed product', function() {
        analytics.track('viewed product', {
          sku: 1,
          name: 'item',
          category: 'category',
          price: 9
        });
        analytics.called(window._kmq.push, ['record', 'viewed product', {
          'viewed product - sku': 1,
          'viewed product - name': 'item',
          'viewed product - category': 'category',
          'viewed product - price': 9
        }]);
      });

      it('should track added product', function() {
        analytics.track('added product', {
          sku: 1,
          name: 'item',
          category: 'category',
          price: 9,
          quantity: 2
        });
        analytics.called(window._kmq.push, ['record', 'added product', {
          'added product - sku': 1,
          'added product - name': 'item',
          'added product - category': 'category',
          'added product - price': 9,
          'added product - quantity': 2
        }]);
      });

      it('should track completed order', function() {
        analytics.track('completed order', {
          orderId: '12074d48',
          tax: 16,
          total: 166,
          products: [{
            sku: '40bcda73',
            name: 'my-product',
            price: 75,
            quantity: 1
          }, {
            sku: '64346fc6',
            name: 'other-product',
            price: 75,
            quantity: 1
          }]
        }, {
          timestamp: new Date(0)
        });

        analytics.assert.deepEqual(window._kmq.push.args[0][0], ['record', 'completed order', {
          'completed order - orderId': '12074d48',
          'completed order - tax': 16,
          'completed order - total': 166,
          // TODO: Remove this?
          'completed order - products': [{
            sku: '40bcda73',
            name: 'my-product',
            price: 75,
            quantity: 1
          }, {
            sku: '64346fc6',
            name: 'other-product',
            price: 75,
            quantity: 1
          }]
        }]);
      });

      it('should add items once KM is loaded', function() {
        analytics.track('completed order', {
          orderId: '12074d48',
          tax: 16,
          products: [{
            sku: '40bcda73',
            name: 'my-product',
            category: 'my-category',
            price: 75,
            quantity: 1
          }, {
            sku: '64346fc6',
            name: 'other-product',
            category: 'my-other-category',
            price: 75,
            quantity: 1
          }]
        }, {
          timestamp: new Date(0)
        });

        // TODO: what is happening here?
        var fn = window._kmq.push.args[1][0];
        analytics.calledTwice(window._kmq.push);
        analytics.assert(typeof fn === 'function');
        fn();

        analytics.assert.deepEqual(window.KM.set.args[0][0], {
          'completed order - category': 'my-category',
          'completed order - name': 'my-product',
          'completed order - price': 75,
          'completed order - quantity': 1,
          'completed order - sku': '40bcda73',
          _d: 1,
          _t: 0
        });

        analytics.assert.deepEqual(window.KM.set.args[1][0], {
          'completed order - category': 'my-other-category',
          'completed order - name': 'other-product',
          'completed order - price': 75,
          'completed order - quantity': 1,
          'completed order - sku': '64346fc6',
          _d: 1,
          _t: 1
        });
      });
    });
  });
});
