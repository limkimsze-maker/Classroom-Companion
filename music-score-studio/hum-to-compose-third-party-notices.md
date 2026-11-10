# Hum to Compose TEST — third-party software notices

This notice covers the default **Spotify Basic Pitch recognition engine** and the optional **OpenSheetMusicDisplay engraved score renderer** in
`music-score-studio/hum-to-compose-test.html`. The published Music Score Studio
application and its own licensing/attribution remain unchanged.

## Basic Pitch — Spotify AB
- Copyright © 2022 Spotify AB.
- Software/model: **@spotify/basic-pitch version 1.0.1**, Apache License, Version 2.0 (SPDX: Apache-2.0).
- Original source: https://github.com/spotify/basic-pitch-ts
- NPM distribution: https://www.npmjs.com/package/@spotify/basic-pitch/v/1.0.1
- Full licence text: [hum-to-compose-APACHE-2.0-LICENSE.txt](./hum-to-compose-APACHE-2.0-LICENSE.txt)
- Upstream licence: https://github.com/spotify/basic-pitch-ts/blob/main/LICENSE
- Model documentation: https://github.com/spotify/basic-pitch-ts/tree/main/model

The experimental interface automatically loads unmodified upstream package code
from a **version-pinned** ESM CDN URL:
https://esm.sh/@spotify/basic-pitch@1.0.1?bundle

The default TensorFlow.js model is pinned to Spotify's public
`basic-pitch-ts` upstream repository commit `2d498f82b61c71898edf0e8dd661b99076676c8b`.

The browser tries the immutable repository snapshot on jsDelivr:
https://cdn.jsdelivr.net/gh/spotify/basic-pitch-ts@2d498f82b61c71898edf0e8dd661b99076676c8b/model/model.json

If that host fails, the browser tries the same pinned manifest from the official
Spotify GitHub repository:
https://raw.githubusercontent.com/spotify/basic-pitch-ts/2d498f82b61c71898edf0e8dd661b99076676c8b/model/model.json

The `group1-shard1of1.bin` weights file is referenced by that manifest and
loaded from the same model host. Both paths are pinned to the same source revision.

**No Spotify source files or model weights are copied into this repository**;
the browser obtains them from those public distributions when the user starts
a microphone recording or imports audio for automatic transcription. The adaptation/glue code is our own, and Spotify's
software is not modified. Spotify has not endorsed or sponsored this project.

## Professional score engraving — OpenSheetMusicDisplay

- Software: **OpenSheetMusicDisplay version 2.1.3** (BSD-3-Clause).
- Copyright © 2019 PhonicScore.
- Source: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
- Upstream licence: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/blob/develop/LICENSE
- The prototype loads the same version-pinned browser distribution as the
  published Music Score Studio from:
  https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@2.1.3/build/opensheetmusicdisplay.min.js
- The original score remains editable in the built-in SVG review view. Engraved
  notation is generated locally from the current MusicXML; audio is not sent to
  OpenSheetMusicDisplay or its CDN.

### OpenSheetMusicDisplay BSD-3-Clause copyright notice

The upstream project's licence text is reproduced below for attribution:

```text
Copyright 2019 PhonicScore

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may
be used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## Upstream runtime dependencies

The pinned Basic Pitch package declares:
- **TensorFlow.js (@tensorflow/tfjs, compatible version ^3.2.0)** — Apache-2.0
  (Google LLC and contributors): https://github.com/tensorflow/tfjs/blob/master/LICENSE
- **@tonejs/midi (compatible version ^2.0.28)** — MIT
  (Tonejs/Midi contributors): https://github.com/Tonejs/Midi/blob/master/LICENSE.md

These and potentially transitive packages can be delivered via the ESM CDN.
Their copyright and licence notices must be retained under their respective
terms. **Before any release**, produce and verify a frozen dependency list and
third-party licence report for the exact resolved CDN/bundle artifacts, including
all transitive dependencies. This test-only integration is not a final release
licence audit.

### Full MIT permission notice for @tonejs/midi

The following licence text is reproduced from
https://github.com/Tonejs/Midi/blob/master/LICENSE.md and retained for
attribution and redistribution compliance.

```text
[The MIT License](http://opensource.org/licenses/MIT)

Copyright © 2016 Yotam Mann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Data use and consent

- Original recordings and chosen local audio files are analysed inside the
  user's browser; the application does not upload the recording to Spotify,
  Google, the project owner, or the CDN.
- Spotify Basic Pitch is the default engine. On first transcription, loading its
  model and JavaScript files **does require network
  requests to the public CDNs**. Like ordinary CDN requests, they expose
  request metadata, such as IP address and user-agent, to those CDN operators.
- A locally generated score is still an estimate and requires teacher review.
- Users must have appropriate rights to the audio recordings they supply.

## Compatibility with the project

The Music Score Studio prototype's original source remains governed by its
existing licence notices (GNU AGPL-3.0); inclusion of a distinct Apache-2.0
dependency does not remove those obligations.

This testing integration uses third-party software by its documented API.
It neither copies closed-source services nor claims Spotify approval.
