# UJI Online Handwriting Reader Attribution

This directory includes a browser-only drawing-reader model and inference code adapted from:
Vahini Technologies, imu2text, https://github.com/vahinitech/imu2text
Original files: playground/reader.js and playground/reader-weights.js
The source code is Apache-2.0; see LICENSE-APACHE-2.0.txt and the original NOTICE reproduced below.
Changes in Classroom Companion: exported globals renamed for namespace isolation; optional recognition uses the original rasterizer. This is the drawing-reader CNN, not a sensor-pen or IMU model.

The model was trained by upstream authors on UJI Pen Characters v2, not by the Classroom Companion maintainer:
Prat, F., Castro, M., Llorens, D., Marzal, A., & Vilar, J. (2008). UJI Pen Characters (Version 2). UCI Machine Learning Repository, DOI 10.24432/C5FG8S. Dataset license CC BY 4.0.
https://archive.ics.uci.edu/dataset/177/uji+pen+characters+version+2

Reported upstream writer-disjoint test: 20 unseen writers, 2,480 isolated characters, 78.1% exact 62-class and 89.6% when ignoring letter case. These are their results, **not** Classroom Companion end-to-end accuracy.

## Original upstream NOTICE

IMU2Text
Copyright 2026 Vahini Technologies <info@vahinitech.com>

This product includes software developed by Vahini Technologies.

The Apache License 2.0 covers the source code in this repository. It does not
cover the OnHW datasets, which are by Fraunhofer IIS, may be used for
non-commercial purposes only, and are not distributed with this repository.

