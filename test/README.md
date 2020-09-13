The tests provided here serve as basic benchmarks for the speed of the main library functions (currently just the harmonizer), as well as an up-to-date usage test.

Yargs is used to allow the scripts to be parameterized for Github Actions.

The progression provided to each should end on a chord progressing to 'I'.

The success script appends a 'I' onto the end of the script and expects at least one result, and the 'failure' script appends a 'ii' and expects no results. If a result is generated when not expected or if a result is not generated when expected the script will throw an error.