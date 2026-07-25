<template>
  <div class="lottery"><h1 class="page-title">抽奖模式</h1>
    <FluentTabs v-model="mode" :options="modes" />
    <div class="toolbar"><FluentSelect :model-value="prizes.currentId" :options="listOptions" @update:model-value="prizes.switchList" /><FluentButton @click="createList">新建奖品单</FluentButton><FluentButton variant="secondary" @click="exportList">导出 JSON</FluentButton><FluentButton variant="secondary" @click="importList">导入 JSON</FluentButton></div>
    <FluentCard><div class="row"><FluentInput v-model="name" placeholder="奖品名称"/><FluentInput v-model="quality" placeholder="品质，例如：SR"/><FluentInput v-model="quantity" type="number" placeholder="库存"/><FluentInput v-model="weight" type="number" placeholder="概率权重"/><FluentButton @click="add">添加奖品</FluentButton></div><div v-for="p in prizes.current.prizes" :key="p.id" class="prize"><b>{{p.name}}</b><span>{{p.quality || '普通'}} · 库存 {{p.quantity}} · 权重 {{p.weight}}</span></div></FluentCard>
    <FluentSelect v-if="mode==='assign'" :model-value="names.currentListId" :options="peopleLists" @update:model-value="names.switchList" />
    <FluentButton variant="primary" size="lg" :disabled="!available" @click="draw">{{mode==='assign'?'抽人并分配奖品':'开始抽奖'}}</FluentButton><h2 v-if="result">{{result}}</h2>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePrizesStore } from '../stores/prizes'
import { useNamesStore } from '../stores/names'
import FluentTabs from '../components/FluentTabs.vue'; import FluentCard from '../components/FluentCard.vue'; import FluentInput from '../components/FluentInput.vue'; import FluentButton from '../components/FluentButton.vue'; import FluentSelect from '../components/FluentSelect.vue'
const prizes=usePrizesStore(), names=useNamesStore(); const mode=ref('prize'), name=ref(''),quality=ref(''),quantity=ref(1),weight=ref(1),result=ref('')
const modes=[{value:'prize',label:'直接抽奖',icon:'fluent:gift-24-regular'},{value:'assign',label:'先抽人再分配',icon:'fluent:people-24-regular'}]
const listOptions=computed(()=>Object.values(prizes.lists).map(x=>({value:x.id,label:x.name}))); const peopleLists=computed(()=>names.allLists.map(x=>({value:x.id,label:x.name}))); const available=computed(()=>prizes.current.prizes.some(p=>p.quantity>0))
onMounted(async()=>{await prizes.initialize();await names.initialize()}); function add(){if(name.value.trim()){prizes.add(name.value.trim(),quantity.value,weight.value);prizes.current.prizes.at(-1).quality=quality.value.trim();prizes.save();name.value='';quality.value=''}} function createList(){prizes.createList(`奖品单 ${Object.keys(prizes.lists).length+1}`)}
function draw(){const prize=prizes.pick();if(!prize)return result.value='奖品已抽完';if(mode.value==='assign'){const pool=names.currentNames.filter(p=>!p.isWhiteList);const person=pool[Math.floor(Math.random()*pool.length)];result.value=person?`${person.cn} 获得 ${prize.name}`:`获得 ${prize.name}`}else result.value=`中奖：${prize.name}`}
function exportList(){const blob=new Blob([JSON.stringify(prizes.current,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${prizes.current.name}.json`;a.click();URL.revokeObjectURL(a.href)} function importList(){const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{prizes.importList(JSON.parse(await input.files[0].text()))}catch{}};input.click()}
</script>
<style scoped>.lottery{padding:32px;display:grid;gap:16px;max-width:1000px}.toolbar,.row{display:flex;gap:10px;flex-wrap:wrap}.prize{padding:12px;border-bottom:1px solid var(--border-default);display:flex;gap:14px}.prize span{color:var(--text-muted)}</style>
