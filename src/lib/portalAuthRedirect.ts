/** Safe post-login destination for client portal magic links. */
export function resolvePortalAuthRedirect(searchParams: URLSearchParams): string {
  const redirect = searchParams.get('redirect');
  if (redirect && redirect.startsWith('/client-portal') && !redirect.startsWith('//')) {
    return redirect;
  }

  const estimateId = searchParams.get('estimateId');
  if (estimateId && /^[a-fA-F0-9]{24}$/.test(estimateId)) {
    return `/client-portal/estimates/${estimateId}`;
  }

  return '/client-portal';
}
