/**
 * Narrows `value` to non-null/non-undefined via a genuine runtime check
 * that throws with a useful message, rather than a `!` or `as` assertion
 * that would only silence the compiler — `no-non-null-assertion` is part of
 * this project's `strict-type-checked` ESLint rule set with no exception
 * for tests, and for good reason here: a query like `document.querySelector`
 * returning `null` usually means the test's setup is wrong, and `!` would
 * turn that into a confusing "cannot read property of null" a few lines
 * later instead of a clear failure at the actual point of the mistake.
 */
export function assertDefined<T>(value: T, message: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}
