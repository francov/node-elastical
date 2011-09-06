/*
These tests can run without an ElasticSearch server.
*/

var elastical = require('../index'),

    assert   = require('assert'),
    parseUrl = require('url').parse,
    vows     = require('vows');

vows.describe('Elastical').addBatch({
    'Client': {
        topic: new elastical.Client(),

        // -- Properties -------------------------------------------------------
        '`host` should default to "127.0.0.1"': function (client) {
            assert.equal(client.host, '127.0.0.1');
        },

        '`port` should default to 9200': function (client) {
            assert.strictEqual(client.port, 9200);
            assert.strictEqual(client.options.port, 9200);
        },

        '`timeout` should default to 10000': function (client) {
            assert.strictEqual(client.options.timeout, 10000);
        },

        '`baseUrl` should reflect the current host and port': function (client) {
            assert.equal(client.baseUrl, 'http://127.0.0.1:9200');

            client.host = 'example.com';
            client.options.port = 42;

            assert.equal(client.baseUrl, 'http://example.com:42');
        },

        // -- Methods ----------------------------------------------------------
        '`createIndex()`': {
            'without options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.createIndex('new-index');
                },

                'method should be PUT': function (err, options) {
                    assert.equal(options.method, 'PUT');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/new-index');
                },

                'request should not have a body': function (err, options) {
                    assert.isUndefined(options.body);
                    assert.isUndefined(options.json);
                }
            },

            'with options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.createIndex('new-index', {
                        settings: {number_of_shards: 1}
                    });
                },

                'options should be passed in the request body': function (err, options) {
                    assert.deepEqual({settings: {number_of_shards: 1}}, options.json);
                }
            }
        },

        '`delete()`': {
            'without options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.delete('posts', 'post', '1');
                },

                'method should be DELETE': function (err, options) {
                    assert.equal(options.method, 'DELETE');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/posts/post/1');
                },

                'URL should not have a query string': function (err, options) {
                    assert.isUndefined(parseUrl(options.url).search);
                }
            },

            'with options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.delete('posts', 'post', '1', {
                        consistency  : 'all',
                        ignoreMissing: true,
                        parent       : '42',
                        refresh      : true,
                        replication  : 'async',
                        routing      : 'hashyhash',
                        version      : 18
                    });
                },

                'URL query string should contain the options': function (err, options) {
                    var query = parseUrl(options.url, true).query;

                    assert.deepEqual({
                        consistency: 'all',
                        parent     : '42',
                        refresh    : '1',
                        replication: 'async',
                        routing    : 'hashyhash',
                        version    : '18'
                    }, query);
                }
            }
        },

        '`deleteIndex()`': {
            'with one index': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.deleteIndex('foo');
                },

                'method should be DELETE': function (err, options) {
                    assert.equal(options.method, 'DELETE');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/foo');
                }
            },

            'with multiple indices': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.deleteIndex(['foo', 'bar']);
                },

                'method should be DELETE': function (err, options) {
                    assert.equal(options.method, 'DELETE');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/foo%2Cbar');
                }
            }
        },

        '`get()`': {
            'without options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.get('blog', 1);
                },

                'method should be GET': function (err, options) {
                    assert.equal(options.method, 'GET');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/blog/_all/1');
                }
            },

            'with options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.get('blog', 1, {
                        fields    : ['one', 'two'],
                        preference: '_primary',
                        realtime  : false,
                        refresh   : true,
                        routing   : 'hashyhash',
                        type      : 'post'
                    });
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/blog/post/1');
                },

                'URL query string should contain the options': function (err, options) {
                    var query = parseUrl(options.url, true).query;

                    assert.deepEqual({
                        fields    : 'one,two',
                        preference: '_primary',
                        realtime  : '0',
                        refresh   : '1',
                        routing   : 'hashyhash'
                    }, query);
                }
            }
        },

        '`getIndex()` should get an Index instance': function (client) {
            var index = client.getIndex('foo');

            assert.instanceOf(index, elastical.Index);
            assert.strictEqual(client, index.client);
        },

        '`getIndex()` should cache Index instances': function (client) {
            assert.strictEqual(client.getIndex('foo'), client.getIndex('foo'));
        },

        '`index()`': {
            'without options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.index('blog', 'post', {
                        title  : 'Hello',
                        content: 'Moo.'
                    });
                },

                'method should be POST': function (err, options) {
                    assert.equal(options.method, 'POST');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/blog/post');
                },

                'request body should be set': function (err, options) {
                    assert.deepEqual({
                        title  : 'Hello',
                        content: 'Moo.'
                    }, options.json);
                }
            },

            'with options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.index('blog', 'post', {
                        title  : 'Hello',
                        content: 'Moo.'
                    }, {
                        consistency: 'all',
                        create     : true,
                        id         : '1',
                        parent     : '42',
                        percolate  : '*',
                        refresh    : true,
                        replication: 'async',
                        routing    : 'hashyhash',
                        timeout    : '5m',
                        version    : '42'
                    });
                },

                'method should be PUT': function (err, options) {
                    assert.equal(options.method, 'PUT');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/blog/post/1');
                },

                'URL query string should contain the options': function (err, options) {
                    var query = parseUrl(options.url, true).query;

                    assert.deepEqual({
                        consistency : 'all',
                        op_type     : 'create',
                        parent      : '42',
                        percolate   : '*',
                        refresh     : '1',
                        replication : 'async',
                        routing     : 'hashyhash',
                        timeout     : '5m',
                        version     : '42',
                        version_type: 'external' // set automatically
                    }, query);
                }
            }
        },

        '`indexExists()`': {
            'with one index': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.indexExists('foo');
                },

                'method should be HEAD': function (err, options) {
                    assert.equal(options.method, 'HEAD');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/foo');
                }
            },

            'with multiple indices': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.indexExists(['foo', 'bar']);
                },

                'method should be HEAD': function (err, options) {
                    assert.equal(options.method, 'HEAD');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/foo%2Cbar');
                }
            }
        },

        '`search()`': {
            'without options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.search(function () {});
                },

                'method should be GET': function (err, options) {
                    assert.equal(options.method, 'GET');
                },

                'request should not have a body': function (err, options) {
                    assert.isUndefined(options.body);
                    assert.isUndefined(options.json);
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/_search');
                }
            },

            'with options': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.search({
                        query        : {query_string: {query: 'foo'}},
                        explain      : true,
                        facets       : {},
                        fields       : ['one', 'two'],
                        filter       : {},
                        from         : 3,
                        highlight    : {},
                        index        : 'blog',
                        indices_boost: {},
                        min_score    : 0.5,
                        preference   : '_primary',
                        routing      : 'hashyhash',
                        script_fields: {},
                        scroll       : '1m',
                        scroll_id    : 'foo',
                        search_type  : 'query_and_fetch',
                        size         : 42,
                        sort         : {},
                        timeout      : '15s',
                        track_scores : true,
                        type         : 'post',
                        version      : true
                    }, function () {});
                },

                'method should be POST': function (err, options) {
                    assert.equal(options.method, 'POST');
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/blog/post/_search');
                },

                'URL query string should contain the correct parameters': function (err, options) {
                    var query = parseUrl(options.url, true).query;

                    assert.deepEqual({
                        preference : '_primary',
                        routing    : 'hashyhash',
                        scroll     : '1m',
                        scroll_id  : 'foo',
                        search_type: 'query_and_fetch',
                        timeout    : '15s'
                    }, query);
                },

                'request body should contain the correct options': function (err, options) {
                    assert.deepEqual({
                        query        : {query_string: {query: 'foo'}},
                        explain      : true,
                        facets       : {},
                        fields       : ['one', 'two'],
                        filter       : {},
                        from         : 3,
                        highlight    : {},
                        indices_boost: {},
                        min_score    : 0.5,
                        script_fields: {},
                        size         : 42,
                        sort         : {},
                        track_scores : true,
                        version      : true
                    }, options.json);
                }
            },

            'with index but no type': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.search({index: 'blog'}, function () {});
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/blog/_search');
                }
            },

            'with type but no index': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.search({type: 'post'}, function () {});
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/_all/post/_search');
                }
            },

            'with multiple indices and types': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.search({
                        index: ['blog', 'twitter'],
                        type : ['post', 'tweet']
                    }, function () {});
                },

                'URL should have the correct path': function (err, options) {
                    assert.equal(parseUrl(options.url).pathname, '/blog%2Ctwitter/post%2Ctweet/_search');
                }
            },

            'with `options.query` set to a string': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.search({query: 'foo'}, function () {});
                },

                'should convert the query into a query_string query object': function (err, options) {
                    assert.deepEqual({
                        query: {query_string: {query: 'foo'}}
                    }, options.json);
                }
            },

            'with `options.fields` set to a string': {
                topic: function (client) {
                    client._testHook = this.callback;
                    client.search({fields: 'title'}, function () {});
                },

                'request body should contain an array with a single field name': function (err, options) {
                    assert.deepEqual({fields: ['title']}, options.json);
                }
            }
        },

        '`set()` should be an alias for `index()`': function (client) {
            assert.strictEqual(client.index, client.set);
        }
    },

    'Client with host': {
        topic: new elastical.Client('example.com'),

        '`host` should equal "example.com"': function (client) {
            assert.equal(client.host, 'example.com');
        }
    },

    'Client with host and options': {
        topic: new elastical.Client('example.com', {port: 42, timeout: 5000}),

        '`host` should equal "example.com"': function (client) {
            assert.equal(client.host, 'example.com');
        },

        '`port` should equal 42': function (client) {
            assert.strictEqual(client.port, 42);
            assert.strictEqual(client.options.port, 42);
        },

        '`timeout` should equal 5000': function (client) {
            assert.strictEqual(client.options.timeout, 5000);
        }
    },

    'Index': {
        topic: new elastical.Client().getIndex('foo'),

        '`name` should be the index name': function (index) {
            assert.equal(index.name, 'foo');
        },

        '`search()`': {
            topic: function (index) {
                index.client._testHook = this.callback;
                index.search({query: 'test'}, function () {});
            },

            'URL should have the correct path': function (err, options) {
                assert.equal(parseUrl(options.url).pathname, '/foo/_search');
            },

            'options should be passed through': function (err, options) {
                assert.deepEqual({
                    query: {query_string: {query: 'test'}}
                }, options.json);
            }
        },

        '`set()` should be an alias for `index()`': function (index) {
            assert.strictEqual(index.set, index.index);
        }
    }
}).export(module);