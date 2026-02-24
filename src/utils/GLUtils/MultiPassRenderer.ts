import type {
    GL, 
    RenderPassConfig
} from "./types"
import { RenderPass } from "./RenderPass";

export class MultiPassRenderer{
    private gl: GL;
    private passes: Map<string, RenderPass> = new Map();
    private passesArray: RenderPass[] = [];
    private globalUniforms: Record<string, any> = {};

    constructor(canvas: HTMLCanvasElement, configs: RenderPassConfig[]){
        const gl = canvas.getContext("webgl2");
        if(!gl) throw new Error("WebGL 2 not supported");

        const ext = gl.getExtension("EXT_color_buffer_float");
        if (!ext) throw new Error("EXT_color_buffer_float not supported");

        this.gl = gl;
        const passesArray: typeof this.passesArray = [];
        for(const [index, cfg] of configs.entries()){
            const pass  = new RenderPass(gl, cfg.shader, cfg.outputToScreen);
            pass.setConfig(cfg);
            this.passes.set(cfg.name, pass);
            passesArray[index]=pass;
        }
        this.passesArray = passesArray;
    }

    public resize(width: number, height: number): void{
        this.passesArray.forEach((pass)=>{
            pass.resize(width, height);
        });
    }

    public setUniform(name: string, value:any){
        this.globalUniforms[name]=value;
    }

    public setUniforms(uniforms: Record<string, any>): void{
        Object.assign(this.globalUniforms, uniforms);
    }

    public clearUniforms(name: string){
        delete this.globalUniforms[name];
    }

    public clearAllUniforms(): void{
        this.globalUniforms = {}
    }

    public render(
        passUniforms?: Record<string, any>[] |
            Record<string, Record<string, any>>
    ): void{
        this.passesArray.forEach((pass, index)=>{
            const uniforms: Record<string, any>= {...this.globalUniforms};
            if(passUniforms){
                if(Array.isArray(passUniforms))
                    Object.assign(uniforms, passUniforms[index]);
                else{
                    Object.assign(uniforms, passUniforms[pass.config.name] ?? null);
                }
            }

            if(pass.config.inputs){
                Object.entries(pass.config.inputs).forEach(([uniformName, fromPassName])=>{
                    const fromPass = this.passes.get(fromPassName);
                    uniforms[uniformName] = fromPass?.getOutputTexture();
                });
            }
            pass.render(uniforms);
        });
    }

    public dispose():void{
        const gl = this.gl;

        this.passes.forEach(pass=>{
            pass.dispose();
        });
        this.passes.clear();
        this.clearAllUniforms();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}

