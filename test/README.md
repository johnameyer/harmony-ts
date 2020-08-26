The tests provided here serve as basic benchmarks for the speed of the library, as well as an up-to-date usage test.

The current 'success' scripts provide a valid chord progression that should be possible to harmonize. Both succeed because the progression is valid by the current rules of the harmonizer.

The 'failure-check' script fails quickly because the chord progression provided is not known.

The 'failure-no-check' script fails slowly because the chord progression is not known, but checks are disabled, meaning the harmonizer will attempt every exponential solution to solve the last two chords. With the resolution of GH-18 this should also finish in about the same amount of time.