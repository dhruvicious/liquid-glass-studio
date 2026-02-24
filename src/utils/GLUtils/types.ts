type GL = WebGL2RenderingContext;

interface ShaderSource{
    vertex: string;
    fragment: string;
}

interface AttributeInfo{
    location: number;
    size: number;
    type: number;
}

interface UniformInfo{
    location: WebGLUniformLocation;
    type: number;
    value: any;
    isArray: false | { size : number; };
}


interface RenderPassConfig{
    name: string;
    shader: ShaderSource;
    inputs?: {[uniformName: string]: string};
    outputToScreen?: boolean;
}

export type {GL, ShaderSource, AttributeInfo, UniformInfo, RenderPassConfig};