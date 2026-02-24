export function updateVideoTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  video: HTMLVideoElement
) {
  if (video.readyState < video.HAVE_CURRENT_DATA) return;

  let ratio = video.videoWidth / video.videoHeight;
  if (isNaN(ratio)) {
    ratio = 1;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // 可选：取决于你 shader 中纹理坐标是否上下颠倒
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    video.videoWidth,
    video.videoHeight,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    video
  );
  gl.generateMipmap(gl.TEXTURE_2D);

  return {
    ratio: ratio,
  }
}