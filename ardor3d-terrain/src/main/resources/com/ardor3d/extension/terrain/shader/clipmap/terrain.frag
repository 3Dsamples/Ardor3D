#version 330 core

in vec2 vVertex;

out vec4 FragColor;

uniform sampler3D texture;

uniform float levels;
uniform float minLevel;
uniform float validLevels;
uniform float textureSize; 
uniform float texelSize; 
uniform float showDebug; 
uniform vec2 sliceOffset[16];
uniform vec3 eyePosition;

vec4 texture3DBilinear( const in sampler3D textureSampler, const in vec3 uv)
{
    vec4 tl = texture(textureSampler, uv);
    vec4 tr = texture(textureSampler, uv + vec3(texelSize, 0, 0));
    vec4 bl = texture(textureSampler, uv + vec3(0, texelSize, 0));
    vec4 br = texture(textureSampler, uv + vec3(texelSize , texelSize, 0));

    vec2 f = fract( uv.xy * textureSize ); // get the decimal part
    vec4 tA = mix( tl, tr, f.x ); // will interpolate the red dot in the image
    vec4 tB = mix( bl, br, f.x ); // will interpolate the blue dot in the image
    return mix( tA, tB, f.y ); // will interpolate the green dot in the image
}

/**
 * lookup fragment color in texture clipmap
 */
vec4 clipTexColor(float unit) {
	vec2 offset = sliceOffset[int(unit)];	
	float frac = unit;
	frac = exp2(frac);	
	frac *= 4.0; //Magic number	
	vec2 texCoord = vVertex/vec2(frac);
	vec2 fadeCoord = texCoord;
	texCoord += vec2(0.5);
	texCoord *= vec2(1.0 - texelSize);
	texCoord += offset;

	float unit2 = unit + 1.0;
	unit2 = min(unit2, validLevels);
	vec2 offset2 = sliceOffset[int(unit2)];	
	float frac2 = unit2;
	frac2 = exp2(frac2);	
	frac2 *= 4.0; //Magic number	
	vec2 texCoord2 = vVertex/vec2(frac2);
	texCoord2 += vec2(0.5);
	texCoord2 *= vec2(1.0 - texelSize);
	texCoord2 += offset2;
	
	unit /= levels;	
	unit = clamp(unit, 0.0, 0.99);

	unit2 /= levels;	
	unit2 = clamp(unit2, 0.0, 0.99);

	vec4 tex = texture3DBilinear(texture, vec3(texCoord.x, texCoord.y, unit));
	vec4 tex2 = texture3DBilinear(texture, vec3(texCoord2.x, texCoord2.y, unit2));

	float fadeVal1 = abs(fadeCoord.x)*2.05;
	float fadeVal2 = abs(fadeCoord.y)*2.05;
	float fadeVal = max(fadeVal1, fadeVal2);
	fadeVal = max(0.0, fadeVal-0.8)*5.0;
	fadeVal = min(1.0, fadeVal);
    return mix(tex, tex2, fadeVal) + vec4(fadeVal*showDebug);
}

void main()
{  
	float unit = (max(abs(vVertex.x), abs(vVertex.y)));
	
	unit = floor(unit);
	unit = log2(unit);
	unit = floor(unit);
	
	unit = min(unit, validLevels);
    unit = max(unit, minLevel);
	
    FragColor = clipTexColor(unit);
}
