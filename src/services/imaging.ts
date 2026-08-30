/* imaging service — boundary. Ported target: v2/js/svc-imaging.js
 *
 * STEP 2 SCOPE: boundary + the bucket constant. Migrated in Step 10.
 *   listByPatient · get · pending · countByPatient · signedUrl · thumbUrls
 *   downloadUrl · upload · saveReport · setStatus · update · remove
 *   restore · purge · imaging orders
 *
 * SECURITY INVARIANTS — do not relax:
 *   - bucket is PRIVATE; reads only ever through signed URLs (300s TTL)
 *   - a public image URL must never be produced or stored; the database
 *     rejects them (chk_img_no_public_url, chk_img_path_shape)
 *   - every access is audited via the log_event RPC
 */
export const IMAGING_BUCKET = 'medical-imaging';
export const SIGNED_URL_TTL_SECONDS = 300;
