export type ValidationResult = { valid: boolean; message: string }

export const JUNK_TEXT_BLOCKLIST = [
  'test', 'testing', 'tester', 'testtest', 'fake', 'faker', 'notreal', 'not real', 'dummy', 'sample', 'example',
  'demo', 'temp', 'temporary', 'trial', 'placeholder', 'spam', 'junk', 'trash', 'garbage', 'nonsense', 'bogus',
  'mock', 'stub', 'sandbox', 'dev', 'debug', 'qa',
  'asdf', 'asdfg', 'asdfgh', 'asdfghjkl', 'qwerty', 'qwert', 'qwer', 'qwertyuiop', 'zxcv', 'zxcvb', 'zxcvbn',
  'zxcvbnm', 'qazwsx', '1qaz2wsx', 'sdfgh', 'dfghj', 'fghjk', 'hjkl', 'wasd', 'waesrd', '123qwe', 'qwe123', 'abc123',
  'lorem', 'ipsum', 'loremipsum', 'dolor', 'sit amet',
  'none', 'na', 'n/a', 'nil', 'null', 'undefined', 'void', 'empty', 'blank', 'unknown', 'anon', 'anonymous',
  'no name', 'noname', 'nonamee', 'no namee', 'name', 'username', 'user', 'guest', 'visitor', 'person', 'someone',
  'somebody', 'anyone', 'firstname', 'lastname', 'first name', 'last name', 'your name', 'my name', 'full name', 'fullname',
  'admin', 'administrator', 'root', 'superuser', 'moderator', 'system', 'support', 'helpdesk', 'operator',
  'john doe', 'jane doe', 'john smith', 'jane smith', 'test user', 'test account', 'new user',
  'xxx', 'xxxx', 'xxxxx', 'abc', 'abcd', 'abcde', 'abcdef', 'foo', 'bar', 'baz', 'foobar', 'foobarbaz',
  'blah', 'bleh', 'meh', 'boo', 'yeah', 'yep', 'nope', 'ok', 'okay', 'hi', 'hey', 'hello', 'bye', 'sup', 'yo',
  'idk', 'dunno', 'whatever', 'something', 'anything', 'random', 'string', 'text', 'input', 'field', 'value', 'data',
  'default', 'tbd', 'tba', 'todo', 'fixme', 'wip', 'asap',
  '0', '00', '000', '0000', '1', '11', '111', '1111', '123', '1234', '12345', '123456', '1234567', '12345678',
  '999', '9999', '000000', '111111', '123123', '321', '654321',
  'aa', 'aaa', 'aaaa', 'bb', 'bbb', 'ccc', 'ddd', 'eee', 'fff', 'ggg', 'hhh', 'iii', 'jjj', 'kkk', 'lll', 'mmm',
  'nnn', 'ooo', 'ppp', 'qqq', 'rrr', 'sss', 'ttt', 'uuu', 'vvv', 'www', 'yyy', 'zzz',
  'password', 'pass', 'passwd', 'secret', 'login', 'signup', 'register',
] as const

const BLOCKED_EMAIL_LOCAL_PARTS = [
  'test', 'testing', 'tester', 'fake', 'faker', 'dummy', 'sample', 'example', 'demo', 'asdf', 'qwerty',
  'admin', 'root', 'user', 'guest', 'noemail', 'no-reply', 'noreply', 'donotreply', 'mail', 'email', 'temp',
  'throwaway', 'spam', 'junk', 'null', 'void', '123', '1234', '12345', '111', '000', 'abc', 'aaa', 'xxx',
] as const

const BLOCKED_EMAIL_DOMAINS = [
  'example.com', 'example.org', 'test.com', 'test.test', 'localhost', 'mailinator.com', 'tempmail.com',
  'guerrillamail.com', 'yopmail.com', 'throwaway.email', '10minutemail.com', 'temp-mail.org', 'fakeinbox.com',
  'sharklasers.com', 'trashmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com', 'mailnesia.com',
  'mintemail.com', 'emailondeck.com',
] as const

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function countLetters(value: string): number {
  const matches = value.match(/\p{L}/gu)
  return matches ? matches.length : 0
}

function isRepeatedChar(normalized: string): boolean {
  return /^(.)\1{2,}$/u.test(normalized)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isBlocklisted(normalized: string): boolean {
  if ((JUNK_TEXT_BLOCKLIST as readonly string[]).includes(normalized)) {
    return true
  }

  for (const token of JUNK_TEXT_BLOCKLIST) {
    if (token.includes(' ')) continue
    const pattern = new RegExp(`^${escapeRegExp(token)}[\\s\\-_]*\\d*$`, 'iu')
    if (pattern.test(normalized)) return true
  }

  return false
}

export function validatePersonName(value: string): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length < 3) {
    return { valid: false, message: 'Please enter your real name.' }
  }
  if (countLetters(trimmed) < 2) {
    return { valid: false, message: 'Please enter your real name.' }
  }
  if (/^\d+$/u.test(trimmed) || /^\P{L}+$/u.test(trimmed)) {
    return { valid: false, message: 'Please enter your real name.' }
  }

  const normalized = normalize(trimmed)
  if (isRepeatedChar(normalized) || isBlocklisted(normalized)) {
    return { valid: false, message: 'Please enter your real name.' }
  }

  return { valid: true, message: '' }
}

export function validateOptionalText(value: string): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed) {
    return { valid: true, message: '' }
  }
  if (trimmed.length < 2 || countLetters(trimmed) < 1) {
    return { valid: false, message: 'Please enter a valid value.' }
  }

  const normalized = normalize(trimmed)
  if (isRepeatedChar(normalized) || isBlocklisted(normalized)) {
    return { valid: false, message: 'Please enter a valid value.' }
  }

  return { valid: true, message: '' }
}

export function validatePublicEmail(email: string): ValidationResult {
  const normalized = email.trim().toLowerCase()
  if (!normalized) {
    return { valid: false, message: 'Please use a real email address.' }
  }

  const basicEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!basicEmail.test(normalized)) {
    return { valid: false, message: 'Please use a real email address.' }
  }

  const [local, domain] = normalized.split('@')
  if (!local || !domain) {
    return { valid: false, message: 'Please use a real email address.' }
  }

  if ((BLOCKED_EMAIL_LOCAL_PARTS as readonly string[]).includes(local)) {
    return { valid: false, message: 'Please use a real email address.' }
  }

  if ((BLOCKED_EMAIL_DOMAINS as readonly string[]).includes(domain)) {
    return { valid: false, message: 'Please use a real email address.' }
  }

  return { valid: true, message: '' }
}

export function isNameLikeLabel(label: string): boolean {
  return /\b(name|first|last|full|surname|given|middle)\b/iu.test(normalize(label))
}

export function validateFormFieldValue(
  fieldType: string,
  label: string,
  value: unknown,
): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { valid: true, message: '' }
  }

  const str = String(value)

  switch (fieldType) {
    case 'email':
      return validatePublicEmail(str)
    case 'text':
    case 'textarea':
      return isNameLikeLabel(label) ? validatePersonName(str) : validateOptionalText(str)
    default:
      return { valid: true, message: '' }
  }
}

type FormFieldLike = {
  field_type: string
  label: string
  field_key: string
  is_required: boolean
  validation_rules?: { min_length?: number }
}

export function validateFormFields(
  fields: FormFieldLike[],
  formData: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const value = formData[field.field_key]

    if (
      field.is_required &&
      (value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0))
    ) {
      errors[field.field_key] = `${field.label} is required`
      continue
    }

    if (value === undefined || value === null || value === '') {
      continue
    }

    const result = validateFormFieldValue(field.field_type, field.label, value)
    if (!result.valid) {
      errors[field.field_key] = result.message
      continue
    }

    const minLength = field.validation_rules?.min_length
    if (minLength && String(value).trim().length < minLength) {
      errors[field.field_key] = `${field.label} must be at least ${minLength} characters`
    }
  }

  return errors
}
