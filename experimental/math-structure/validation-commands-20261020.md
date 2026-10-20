# Experimental validation commands

Run the existing complete-expression regression independently:

```sh
node scripts/test-math-structure-regression.cjs
```

Run the actual teacher handwriting control:

```sh
node scripts/test-square-root-real-teacher-ink.cjs
```

These commands do not establish paired V1/V2 benchmark accuracy. Production integration remains prohibited until verified comparative tests pass.
