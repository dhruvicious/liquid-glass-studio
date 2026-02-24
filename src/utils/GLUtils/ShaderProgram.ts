import type {
  GL, 
  ShaderSource, 
  AttributeInfo, 
  UniformInfo, 
} from "./types"

export class ShaderProgram{
    private gl: GL;
    private program: WebGLProgram;
    private uniforms: Map<string, UniformInfo> = new Map();
    private attributes: Map<string, AttributeInfo> = new Map();

    constructor(gl:GL, source: ShaderSource){
        this.gl = gl;
        this.program = this.createProgram(source);
        this.detectAttributes();
        this.detectUniforms();
    }

    private createShader(type: number, source: string): WebGLShader{
        const gl = this.gl;
        const shader = gl.createShader(type);
        if(!shader) throw new Error("Failed to create shader");

        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            const info  = gl.getShaderInfoLog(shader);
            throw new Error(`Shader Compiler Error: ${info}`);
        }
        return shader;
    }

    private createProgram(source: ShaderSource): WebGLProgram{
        const gl = this.gl;
        const program = gl.createProgram();
        if(!program) throw new Error("Failed to create program");

        const vertexShader = this.createShader(gl.VERTEX_SHADER, source.vertex);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, source.fragment);

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Program link Error: ${info}`);
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    private detectAttributes():void{
        const gl = this.gl;
        const numAttributes = gl.getProgramParameter(
            this.program,
            gl.ACTIVE_ATTRIBUTES,
        );

        for(let i = 0;i<numAttributes;i++){
            const info = gl.getActiveAttrib(this.program, i);
            if(!info) continue;

            const location = gl.getAttribLocation(this.program, info.name);
            this.attributes.set(info.name, {
                location,
                size:info.size,
                type: info.type,
            });
        }
    }

    private detectUniforms():void{
        const gl = this.gl;
        const numUniforms = gl.getProgramParameter(
            this.program, gl.ACTIVE_UNIFORMS,
        );

        for(let i = 0;i<numUniforms;i++){
            const info = gl.getActiveUniform(this.program, i);
            if(!info) continue;

            const location = gl.getUniformLocation(this.program, info.name);
            if(!location) continue;

            const originalName = info.name;
            const arrayRegex = /\[\d+\]$/;


            if(arrayRegex.test(originalName)){
                const baseName = originalName.replace(arrayRegex,'');
                this.uniforms.set(baseName,{
                    location,
                    type: info.type,
                    value: null,
                    isArray: {
                        size: info.size
                    }
                });
            }else{
                this.uniforms.set(info.name, {
                    location, 
                    type: info.type, 
                    value: null, 
                    isArray: false
                });
            }
        }
    }

    public use(): void{
        this.gl.useProgram(this.program);
    }

    public setUniform(name: string, value: any):void{
        const gl = this.gl;
        const uniformInfo = this.uniforms.get(name);
        if(!uniformInfo) return;

        const location = uniformInfo.location;

        if(uniformInfo.isArray && Array.isArray(value)){
            switch (uniformInfo.type) {
                case gl.FLOAT:
                    gl.uniform1fv(uniformInfo.location, value);
                    break;
                case gl.FLOAT_VEC2:
                    gl.uniform2fv(uniformInfo.location, value);
                    break;
                case gl.FLOAT_VEC3:
                    gl.uniform3fv(uniformInfo.location, value);
                    break;
                case gl.FLOAT_VEC4:
                    gl.uniform4fv(uniformInfo.location, value);
                    break;
            } 
        }else{
            switch(uniformInfo.type){
                case gl.FLOAT:
                    gl.uniform1f(location, value);
                    break;
                case gl.FLOAT_VEC2:
                    gl.uniform2fv(location, value);
                    break;
                case gl.FLOAT_VEC3:
                    gl.uniform3fv(location, value);
                    break;
                case gl.FLOAT_VEC4:
                    gl.uniform4fv(location, value);
                    break;
                case gl.INT:
                    gl.uniform1i(location, value);
                    break;
                case gl.SAMPLER_2D:
                    gl.uniform1i(location, value);
                    break;
                case gl.FLOAT_MAT3:
                    gl.uniformMatrix3fv(location, false, value);
                    break;
                case gl.FLOAT_MAT4:
                    gl.uniformMatrix3fv(location, false, value);
                    break;
            }
        }
    }

    public getAttributeLocation(name: string): number{
        const attribute = this.attributes.get(name);
        return attribute ? attribute.location : -1;
    }

    public dispose():void{
        const gl = this.gl;

        if(this.program){
            const shaders = gl.getAttachedShaders(this.program);
            if(shaders){
                shaders.forEach(shader=>{
                    gl.deleteShader(shader);
                });
            }
            gl.deleteProgram(this.program);   
        }
        this.uniforms.clear();
        this.attributes.clear();
    }
}