function bot(): Promise<number> {
  return new Promise(resolve => setTimeout(()=>resolve(1),1000));
}

async function bit():Promise<number> {
  const res:number = await bot();
  return new Promise<number>(resolve => resolve(12+res));
}

const promise = bit();
promise.then(result => console.log('dioporcone',result));

