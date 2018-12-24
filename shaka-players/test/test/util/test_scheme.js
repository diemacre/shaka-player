/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('shaka.test.TestScheme');


/**
 * A plugin that handles fake network requests.  This will serve both segments
 * and manifests that will point to a fake manifest generator.
 *
 * @param {string} uri
 * @param {shaka.extern.Request} request
 * @param {shaka.net.NetworkingEngine.RequestType=} requestType
 * @return {!shaka.extern.IAbortableOperation.<shaka.extern.Response>}
 */
shaka.test.TestScheme = function(uri, request, requestType) {
  let manifestParts = /^test:([^/]+)$/.exec(uri);
  if (manifestParts) {
    /** @type {shaka.extern.Response} */
    let response = {
      uri: uri,
      data: new ArrayBuffer(0),
      headers: {'content-type': 'application/x-test-manifest'}
    };
    return shaka.util.AbortableOperation.completed(response);
  }

  let malformed = new shaka.util.Error(
      shaka.util.Error.Severity.CRITICAL,
      shaka.util.Error.Category.NETWORK,
      shaka.util.Error.Code.MALFORMED_TEST_URI);

  let re = /^test:([^/]+)\/(video|audio)\/(init|[0-9]+)$/;
  let segmentParts = re.exec(uri);
  if (!segmentParts) {
    // Use expect so the URI is printed on errors.
    expect(uri).toMatch(re);
    return shaka.util.AbortableOperation.failed(malformed);
  }

  let name = segmentParts[1];
  let type = segmentParts[2];

  let generators = shaka.test.TestScheme.GENERATORS[name];
  expect(generators).toBeTruthy();
  if (!generators) {
    return shaka.util.AbortableOperation.failed(malformed);
  }

  let generator = generators[type];
  expect(generator).toBeTruthy();
  if (!generator) {
    return shaka.util.AbortableOperation.failed(malformed);
  }

  let responseData;
  if (segmentParts[3] === 'init') {
    responseData = generator.getInitSegment(0);
  } else {
    let index = Number(segmentParts[3]);
    responseData = generator.getSegment(index + 1, 0, 0);
  }

  /** @type {shaka.extern.Response} */
  let ret = {uri: uri, data: responseData, headers: {}};
  return shaka.util.AbortableOperation.completed(ret);
};


/** @const {!Object.<string, shaka.extern.Manifest>} */
shaka.test.TestScheme.MANIFESTS = {};


/** @const {!Object.<string, !Object.<string, !shaka.test.IStreamGenerator>>} */
shaka.test.TestScheme.GENERATORS = {};


/** @const */
shaka.test.TestScheme.DATA = {
  'sintel': {
    video: {
      initSegmentUri: '/base/test/test/assets/sintel-video-init.mp4',
      mvhdOffset: 0x24,
      segmentUri: '/base/test/test/assets/sintel-video-segment.mp4',
      tfdtOffset: 0x38,
      segmentDuration: 10,
      presentationTimeOffset: 0,
      mimeType: 'video/mp4',
      codecs: 'avc1.42c01e'
    },
    audio: {
      initSegmentUri: '/base/test/test/assets/sintel-audio-init.mp4',
      mvhdOffset: 0x20,
      segmentUri: '/base/test/test/assets/sintel-audio-segment.mp4',
      tfdtOffset: 0x3c,
      segmentDuration: 10.005,
      presentationTimeOffset: 0,
      mimeType: 'audio/mp4',
      codecs: 'mp4a.40.2'
    },
    text: {
      uri: '/base/test/test/assets/text-clip.vtt',
      mimeType: 'text/vtt'
    },
    duration: 30
  },
  // 'sintel_short_periods' : Generated by createManifests().
  'sintel_no_text': {
    video: {
      initSegmentUri: '/base/test/test/assets/sintel-video-init.mp4',
      mvhdOffset: 0x24,
      segmentUri: '/base/test/test/assets/sintel-video-segment.mp4',
      tfdtOffset: 0x38,
      segmentDuration: 10,
      presentationTimeOffset: 0,
      mimeType: 'video/mp4',
      codecs: 'avc1.42c01e'
    },
    audio: {
      initSegmentUri: '/base/test/test/assets/sintel-audio-init.mp4',
      mvhdOffset: 0x20,
      segmentUri: '/base/test/test/assets/sintel-audio-segment.mp4',
      tfdtOffset: 0x3c,
      segmentDuration: 10.005,
      presentationTimeOffset: 0,
      mimeType: 'audio/mp4',
      codecs: 'mp4a.40.2'
    },
    duration: 30
  },
  'sintel-enc': {
    video: {
      initSegmentUri: '/base/test/test/assets/encrypted-sintel-video-init.mp4',
      mvhdOffset: 0x24,
      segmentUri: '/base/test/test/assets/encrypted-sintel-video-segment.mp4',
      tfdtOffset: 0x38,
      segmentDuration: 10,
      presentationTimeOffset: 0,
      mimeType: 'video/mp4',
      codecs: 'avc1.42c01e',
      initData:
          'AAAAc3Bzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAAFMIARIQaKzMBtasU1iYiGwe' +
          'MeC/ORIQPgfUgWF6UGqdIm5yx/XJtxIQRC1g0g+tXe6lxz4ABfHDnhoNd2lkZXZp' +
          'bmVfdGVzdCIIzsW/9dxA3ckyAA=='
    },
    audio: {
      initSegmentUri: '/base/test/test/assets/encrypted-sintel-audio-init.mp4',
      mvhdOffset: 0x20,
      segmentUri: '/base/test/test/assets/encrypted-sintel-audio-segment.mp4',
      tfdtOffset: 0x3c,
      segmentDuration: 10.005,
      presentationTimeOffset: 0,
      mimeType: 'audio/mp4',
      codecs: 'mp4a.40.2',
      initData:
          'AAAAc3Bzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAAFMIARIQaKzMBtasU1iYiGwe' +
          'MeC/ORIQPgfUgWF6UGqdIm5yx/XJtxIQRC1g0g+tXe6lxz4ABfHDnhoNd2lkZXZp' +
          'bmVfdGVzdCIIzsW/9dxA3ckyAA=='
    },
    text: {
      uri: '/base/test/test/assets/text-clip.vtt',
      mimeType: 'text/vtt'
    },
    licenseServers: {
      'com.widevine.alpha': 'https://cwip-shaka-proxy.appspot.com/no_auth'
    },
    duration: 30
  },
  'multidrm': {
    video: {
      initSegmentUri: '/base/test/test/assets/multidrm-video-init.mp4',
      mvhdOffset: 0x72,
      segmentUri: '/base/test/test/assets/multidrm-video-segment.mp4',
      tfdtOffset: 0x78,
      segmentDuration: 4,
      presentationTimeOffset: 0,
      mimeType: 'video/mp4',
      codecs: 'avc1.64001e',
      initData:
          'AAAANHBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAABQIARIQblodJidXR9eARuq' +
          'l0dNLWg=='
    },
    audio: {
      initSegmentUri: '/base/test/test/assets/multidrm-audio-init.mp4',
      mvhdOffset: 0x72,
      segmentUri: '/base/test/test/assets/multidrm-audio-segment.mp4',
      tfdtOffset: 0x7c,
      segmentDuration: 4,
      presentationTimeOffset: 0,
      mimeType: 'audio/mp4',
      codecs: 'mp4a.40.2',
      initData:
          'AAAANHBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAABQIARIQblodJidXR9eARuq' +
          'l0dNLWg=='
    },
    text: {
      uri: '/base/test/test/assets/text-clip.vtt',
      mimeType: 'text/vtt'
    },
    licenseServers: {
      'com.widevine.alpha':
          'https://drm-widevine-licensing.axtest.net/AcquireLicense',
      'com.microsoft.playready':
          'https://drm-playready-licensing.axtest.net/AcquireLicense'
    },
    licenseRequestHeaders: {
      'X-AxDRM-Message':
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5' +
          'X2lkIjoiNjllNTQwODgtZTllMC00NTMwLThjMWEtMWViNmRjZDBkMTRlIiwibWVzc' +
          '2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImtleXMiOlt7ImlkIj' +
          'oiNmU1YTFkMjYtMjc1Ny00N2Q3LTgwNDYtZWFhNWQxZDM0YjVhIn1dfX0.yF7PflO' +
          'Pv9qHnu3ZWJNZ12jgkqTabmwXbDWk_47tLNE'
    },
    duration: 30
  },
  'multidrm_no_init_data': {
    video: {
      initSegmentUri: '/base/test/test/assets/multidrm-video-init.mp4',
      mvhdOffset: 0x72,
      segmentUri: '/base/test/test/assets/multidrm-video-segment.mp4',
      tfdtOffset: 0x78,
      segmentDuration: 4,
      presentationTimeOffset: 0,
      mimeType: 'video/mp4',
      codecs: 'avc1.64001e'
    },
    audio: {
      initSegmentUri: '/base/test/test/assets/multidrm-audio-init.mp4',
      mvhdOffset: 0x72,
      segmentUri: '/base/test/test/assets/multidrm-audio-segment.mp4',
      tfdtOffset: 0x7c,
      segmentDuration: 4,
      presentationTimeOffset: 0,
      mimeType: 'audio/mp4',
      codecs: 'mp4a.40.2'
    },
    licenseServers: {
      'com.widevine.alpha':
          'https://drm-widevine-licensing.axtest.net/AcquireLicense',
      'com.microsoft.playready':
          'https://drm-playready-licensing.axtest.net/AcquireLicense'
    },
    licenseRequestHeaders: {
      'X-AxDRM-Message':
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5' +
          'X2lkIjoiNjllNTQwODgtZTllMC00NTMwLThjMWEtMWViNmRjZDBkMTRlIiwibWVzc' +
          '2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImtleXMiOlt7ImlkIj' +
          'oiNmU1YTFkMjYtMjc1Ny00N2Q3LTgwNDYtZWFhNWQxZDM0YjVhIn1dfX0.yF7PflO' +
          'Pv9qHnu3ZWJNZ12jgkqTabmwXbDWk_47tLNE'
    },
    duration: 30
  },
  'cea-708_ts': {
    video: {
      segmentUri: '/base/test/test/assets/captions-test.ts',
      mimeType: 'video/mp2t',
      codecs: 'avc1.64001e'
    },
    duration: 30
  }
};


/**
 * Sets up the networking callbacks required to play the given asset.
 *
 * @param {!shaka.Player} player
 * @param {string} name
 */
shaka.test.TestScheme.setupPlayer = function(player, name) {
  let asset = shaka.test.TestScheme.DATA[name];
  goog.asserts.assert(asset, 'Unknown asset');
  if (!asset) return;
  if (asset.licenseRequestHeaders) {
    player.getNetworkingEngine().registerRequestFilter(
        function(type, request) {
          if (type != shaka.net.NetworkingEngine.RequestType.LICENSE) return;

          for (let header in asset.licenseRequestHeaders) {
            request.headers[header] = asset.licenseRequestHeaders[header];
          }
        });
  }
  if (asset.licenseServers) {
    let config = {drm: {servers: asset.licenseServers}};
    player.configure(config);
  }
};


/**
 * Creates the manifests and generators.
 * @param {*} shaka
 * @param {string} suffix
 * @return {!Promise}
 */
shaka.test.TestScheme.createManifests = function(shaka, suffix) {
  /** @type {?} */
  let windowShaka = window['shaka'];

  /**
   * @param {Object} metadata
   * @return {shaka.test.IStreamGenerator}
   */
  function createStreamGenerator(metadata) {
    if (metadata.segmentUri.indexOf('.ts') != -1) {
      return new windowShaka.test.TSVodStreamGenerator(
          metadata.segmentUri);
    }
    return new windowShaka.test.Mp4VodStreamGenerator(
        metadata.initSegmentUri, metadata.mvhdOffset, metadata.segmentUri,
        metadata.tfdtOffset, metadata.segmentDuration,
        metadata.presentationTimeOffset);
  }

  /**
   * @param {shaka.test.ManifestGenerator} manifestGenerator
   * @param {Object} data
   * @param {shaka.util.ManifestParserUtils.ContentType} contentType
   * @param {string} name
   */
  function addStreamInfo(manifestGenerator, data, contentType, name) {
    manifestGenerator
      .presentationTimeOffset(data[contentType].presentationTimeOffset)
      .mime(data[contentType].mimeType, data[contentType].codecs)
      .initSegmentReference(
            ['test:' + name + '/' + contentType + '/init'], 0, null)
      .useSegmentTemplate('test:' + name + '/' + contentType + '/%d',
                          data[contentType].segmentDuration);

    if (data.licenseServers) {
      for (let keySystem in data.licenseServers) {
        manifestGenerator.addDrmInfo(keySystem)
            .licenseServerUri(data.licenseServers[keySystem]);
        if (data[contentType].initData) {
          manifestGenerator.addCencInitData(data[contentType].initData);
        }
      }
    }
  }

  let async = [];
  // Include 'window' to use uncompiled version version of the library.
  const DATA = windowShaka.test.TestScheme.DATA;
  const GENERATORS = windowShaka.test.TestScheme.GENERATORS;
  const MANIFESTS = windowShaka.test.TestScheme.MANIFESTS;
  const ContentType = windowShaka.util.ManifestParserUtils.ContentType;

  for (let name in DATA) {
    GENERATORS[name + suffix] = GENERATORS[name + suffix] || {};
    let data = DATA[name];
    [ContentType.VIDEO, ContentType.AUDIO].forEach(function(type) {
      if (data[type]) {
        let streamGen = createStreamGenerator(data[type]);
        GENERATORS[name + suffix][type] = streamGen;
        async.push(streamGen.init());
      }
    });

    let gen = new windowShaka.test.ManifestGenerator(shaka)
        .setPresentationDuration(data.duration)
        .addPeriod(0)
        .addVariant(0)
          .addVideo(1);
    addStreamInfo(gen, data, ContentType.VIDEO, name);
    if (data[ContentType.AUDIO]) {
      gen.addAudio(2);
      addStreamInfo(gen, data, ContentType.AUDIO, name);
    }

    if (data.text) {
      // This seems to be necessary.  Otherwise, we end up with an URL like
      // "http:/base/..." which then fails to load on Safari for some reason.
      let locationUri = new goog.Uri(location.href);
      let partialUri = new goog.Uri(data.text.uri);
      let absoluteUri = locationUri.resolve(partialUri);

      gen.addTextStream(3)
            .mime(data.text.mimeType, data.text.codecs)
            .textStream(absoluteUri.toString());
    }

    MANIFESTS[name + suffix] = gen.build();
  }

  // Custom generators:

  let data = DATA['sintel'];
  let period_duration = 10;
  let num_periods = 10;
  let gen = new windowShaka.test.ManifestGenerator(shaka)
      .setPresentationDuration(period_duration * num_periods);

  for (let i = 0; i < num_periods; i++) {
    gen.addPeriod(period_duration * i);

    gen.addVariant(2 * i).language('en');
    gen.addVideo(4 * i);
    addStreamInfo(gen, data, ContentType.VIDEO, 'sintel');
    gen.addAudio(4 * i + 1);
    addStreamInfo(gen, data, ContentType.AUDIO, 'sintel');

    gen.addVariant(2 * i + 1).language('es');
    gen.addVideo(4 * i + 2);
    addStreamInfo(gen, data, ContentType.VIDEO, 'sintel');
    gen.addAudio(4 * i + 3);
    addStreamInfo(gen, data, ContentType.AUDIO, 'sintel');
  }

  MANIFESTS['sintel_short_periods' + suffix] = gen.build();

  return Promise.all(async);
};


beforeAll(function(done) {
  shaka.test.TestScheme.createManifests(shaka, '').catch(fail).then(done);
});



/**
 * @constructor
 * @struct
 * @implements {shaka.extern.ManifestParser}
 */
shaka.test.TestScheme.ManifestParser = function() {};


/** @override */
shaka.test.TestScheme.ManifestParser.prototype.configure = function(config) {};


/** @override */
shaka.test.TestScheme.ManifestParser.prototype.start =
    function(uri, playerInterface) {
  let re = /^test:([^/]+)$/;
  let manifestParts = re.exec(uri);
  if (!manifestParts) {
    // Use expect so the URI is printed on errors.
    expect(uri).toMatch(re);
    return Promise.reject();
  }

  let manifest = shaka.test.TestScheme.MANIFESTS[manifestParts[1]];
  expect(manifest).toBeTruthy();
  if (!manifest) return Promise.reject();

  // Invoke filtering interfaces similar to how a real parser would.
  // This makes sure the filtering functions are covered implicitly by tests.
  // This covers regression https://github.com/google/shaka-player/issues/988
  playerInterface.filterAllPeriods(manifest.periods);
  manifest.periods.forEach(function(period) {
    playerInterface.filterNewPeriod(period);
  });

  return Promise.resolve(manifest);
};


/** @override */
shaka.test.TestScheme.ManifestParser.prototype.stop = function() {
  return Promise.resolve();
};


/** @override */
shaka.test.TestScheme.ManifestParser.prototype.update = function() {};


/** @override */
shaka.test.TestScheme.ManifestParser.prototype.onExpirationUpdated =
    function() {};


shaka.net.NetworkingEngine.registerScheme('test', shaka.test.TestScheme);
shaka.media.ManifestParser.registerParserByMime(
    'application/x-test-manifest', shaka.test.TestScheme.ManifestParser);
