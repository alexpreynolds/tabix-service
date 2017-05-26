# tabix-service
A nodejs-based service for requests for tabix-indexed genomic data

## Prerequisites

These instructions assume a CentOS 7 host and sudo-level access.

### `htslib` toolkit

To set up `htslib` (and `bgzip` and `tabix` tools):

```
$ git clone git://github.com/samtools/htslib.git
$ git clone git://github.com/samtools/bcftools.git
$ sudo yum install zlib-devel
$ sudo yum install bzip2-devel
$ sudo yum install xz-devel
$ cd bcftools
$ make
$ make install
$ cd ../htslib
$ make
$ make install
```

This should put `bgzip` and `tabix` into `/usr/local/bin`.

### Compressing and indexing test intervals

Compress and index the test interval file `sample.bed`, if not already done:

```
$ bgzip sample.bed
$ tabix -p bed sample.bed.gz
```

This creates two files: `sample.bed.gz` and `sample.bed.gz.tbi`.

A test query would work like this:

```
$ tabix sample.bed.gz chr1:10000000-11000000
chr1	10037856      10038006	id-501897	102
chr1	10197056      10197206	id-509857	19 
```

### Node.js

To install Node.js:

```
$ sudo yum install epel-release
$ sudo yum install nodejs
```

